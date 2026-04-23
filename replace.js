const fs = require('fs');
let text = fs.readFileSync('abstract.txt', 'utf-8');

const replacements = [
    ['enabling live chat between patients and healthcare providers', 'enabling live chat between patients and hospital administration'],
    ['provider–patient communication', 'hospital–patient communication'],
    ['communicate with healthcare providers via real-time chat', 'communicate with hospital administrators via real-time chat'],
    ['live doctor–patient chat', 'live hospital-patient chat'],
    ['doctor-patient communication', 'hospital-patient communication'],
    ['doctor-patient chat', 'hospital-patient chat'],
    ['doctor-patient hospital chat', 'hospital-patient chat'],
    ['- Can communicate in real-time with their assigned patients using Socket.io chat.\n', ''],
    [' Real-Time Doctor Communication', ' Real-Time Hospital Communication'],
    ['Patients can communicate directly with their assigned doctors', 'Patients can communicate directly with hospital administrators'],
    [' Real-Time Patient Communication\r\nDoctors can communicate instantly with their assigned patients using live chat for consultation support.\r\n\r\n', ''],
    [' Real-Time Patient Communication\nDoctors can communicate instantly with their assigned patients using live chat for consultation support.\n\n', '']
];

for (const [oldStr, newStr] of replacements) {
    text = text.split(oldStr).join(newStr);
}

fs.writeFileSync('abstract.txt', text, 'utf-8');
console.log('Done.');
