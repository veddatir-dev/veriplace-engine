FROM python:3.10-slim

WORKDIR /app

#Install dependencies

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

#Copy all daemon scripts

COPY . .

#Expose the WebSocket port

EXPOSE 8765

#Run both the ledger sync and the integrity scanner in the background

CMD ["sh", "-c", "python ledger_sync.py & python integrity_scanner.py"]