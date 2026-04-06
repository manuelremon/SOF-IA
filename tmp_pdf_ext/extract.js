const fs = require('fs');
const pdf = require('pdf-parse');

let dataBuffer = fs.readFileSync('../Reporte_Auditoria_SOFIA_Corregido.pdf');

pdf(dataBuffer).then(function(data) {
    fs.writeFileSync('output.txt', data.text);
    console.log('Done');
});
