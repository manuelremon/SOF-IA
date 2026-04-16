import { app, dialog, BrowserWindow } from 'electron'
import { join } from 'path'
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'fs'

function getDbPath(): string {
  return join(app.getPath('userData'), 'db', 'sofia.db')
}

export async function createBackup(): Promise<{ success: boolean; path?: string; error?: string }> {
  const win = BrowserWindow.getFocusedWindow()
  const result = await dialog.showSaveDialog(win!, {
    title: 'Guardar backup de base de datos',
    defaultPath: `sofia-backup-${new Date().toISOString().slice(0, 10)}.db`,
    filters: [{ name: 'SQLite Database', extensions: ['db'] }]
  })

  if (result.canceled || !result.filePath) {
    return { success: false, error: 'Cancelado' }
  }

  try {
    const dbPath = getDbPath()
    if (!existsSync(dbPath)) {
      return { success: false, error: 'Base de datos no encontrada' }
    }
    copyFileSync(dbPath, result.filePath)
    return { success: true, path: result.filePath }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function restoreBackup(): Promise<{ success: boolean; error?: string }> {
  const win = BrowserWindow.getFocusedWindow()
  const result = await dialog.showOpenDialog(win!, {
    title: 'Seleccionar backup para restaurar',
    filters: [{ name: 'SQLite Database', extensions: ['db'] }],
    properties: ['openFile']
  })

  if (result.canceled || result.filePaths.length === 0) {
    return { success: false, error: 'Cancelado' }
  }

  try {
    const backupPath = result.filePaths[0]
    const dbPath = getDbPath()

    // Create safety backup before restore
    if (existsSync(dbPath)) {
      copyFileSync(dbPath, dbPath + '.pre-restore.bak')
    }

    copyFileSync(backupPath, dbPath)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

let autoBackupIntervalId: ReturnType<typeof setInterval> | null = null

export function startAutoBackupTimer(intervalHours: number): void {
  if (autoBackupIntervalId) {
    clearInterval(autoBackupIntervalId)
    autoBackupIntervalId = null
  }
  
  if (intervalHours <= 0) return

  const ms = intervalHours * 60 * 60 * 1000
  autoBackupIntervalId = setInterval(() => {
    try {
      const dbPath = getDbPath()
      if (!existsSync(dbPath)) return
      
      const backupsDir = join(app.getPath('userData'), 'backups')
      if (!existsSync(backupsDir)) {
        mkdirSync(backupsDir, { recursive: true })
      }
      
      const filename = `sofia-autobackup-${new Date().toISOString().replace(/[:.]/g, '-')}.db`
      const destPath = join(backupsDir, filename)
      copyFileSync(dbPath, destPath)
      
      const files = readdirSync(backupsDir).filter(f => f.startsWith('sofia-autobackup-') && f.endsWith('.db'))
      if (files.length > 24) {
        files.sort((a, b) => {
          return statSync(join(backupsDir, a)).mtimeMs - statSync(join(backupsDir, b)).mtimeMs;
        })
        const toDelete = files.slice(0, files.length - 24)
        for (const file of toDelete) {
          unlinkSync(join(backupsDir, file))
        }
      }
    } catch (error) {
      console.error('Auto backup failed:', error)
    }
  }, ms)
}
