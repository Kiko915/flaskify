def format_phone(phone_number):
    if phone_number.startswith('0'):
        phone_number = '+63' + phone_number[1:]
        
    return phone_number