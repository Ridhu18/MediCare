import re
import sys

try:
    with open('abstract.txt', 'r', encoding='utf-8') as f:
        text = f.read()

    replacements = [
        ('enabling live chat between patients and healthcare providers', 'enabling live chat between patients and hospital administrators'),
        ('provider–patient communication', 'hospital–patient communication'),
        ('communicate with healthcare providers via real-time chat', 'communicate with hospital administrators via real-time chat'),
        ('live doctor–patient chat', 'live hospital-patient chat'),
        ('doctor-patient communication', 'hospital-patient communication'),
        ('doctor-patient chat', 'hospital-patient chat'),
        ('doctor-patient hospital chat', 'hospital-patient chat'),
        ('- Can communicate in real-time with their assigned patients using Socket.io chat.\n', ''),
        (' Real-Time Doctor Communication', ' Real-Time Hospital Communication'),
        ('Patients can communicate directly with their assigned doctors', 'Patients can communicate directly with hospital administrators'),
        (' Real-Time Patient Communication\nDoctors can communicate instantly with their assigned patients using live chat for consultation support.\n\n', '')
    ]

    for old, new in replacements:
        text = text.replace(old, new)

    text = text.replace('doctor-patient chat', 'hospital-patient chat')
    text = text.replace('doctor-patient communication', 'hospital-patient communication')

    with open('abstract.txt', 'w', encoding='utf-8') as f:
        f.write(text)
    print('Done replacing.')
except Exception as e:
    print('Error:', e)
