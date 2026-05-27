#!/bin/bash

# DATABASE_URL'den bağlantı bilgilerini çıkar
# Format: mysql://user:password@host:port/database
DB_URL="${DATABASE_URL}"

# URL'den parçaları çıkar
if [[ $DB_URL =~ mysql://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+) ]]; then
    USER="${BASH_REMATCH[1]}"
    PASS="${BASH_REMATCH[2]}"
    HOST="${BASH_REMATCH[3]}"
    PORT="${BASH_REMATCH[4]}"
    DB="${BASH_REMATCH[5]}"
    
    echo "Bağlantı Bilgileri:"
    echo "Host: $HOST"
    echo "Port: $PORT"
    echo "Database: $DB"
    echo ""
    
    # MySQL sorgusu çalıştır
    mysql -h "$HOST" -P "$PORT" -u "$USER" -p"$PASS" "$DB" -e "SELECT COUNT(*) as 'Toplam Soru Sayısı' FROM field_inspection_questions;" 2>&1
else
    echo "DATABASE_URL parse edilemedi"
    echo "DATABASE_URL: $DB_URL"
fi
