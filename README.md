# Laptoplock

**Laptoplock** is een eenvoudige tool waarmee ouders op afstand het apparaat van hun kind kunnen vergrendelen. Handig voor bijvoorbeeld huiswerktijd of het stellen van digitale grenzen.

De software draait op de laptop van het kind, en via een ouderinterface kunnen opdrachten verstuurd worden om het apparaat te vergrendelen/ontgrendelen.

---

## Installatie

Installeer `laptoplock` op het apparaat dat je wilt kunnen vergrendelen.

```bash
git clone https://github.com/computer-wilco/laptoplock.git
cd laptoplock
npm install
npm start
```
Let op! `electron-builder` wordt dan ook geïnstalleerd. Je kunt ook voor de `npm install` ook `npm uninstall --save-dev electron-builder` uitvoeren. Dat bespaart een hoop installatietijd.

## Configuratie
Let er wel op dat je ook een ouderpagina nodig zult hebben. Hier enkele voorbeelden:
Zo zou de ouderpagina eruit kunnen zien:
```html
<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vergrendel Instellingen</title>
    <script src="/socket.io/socket.io.js"></script>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f0fdf4;
            color: #333;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
        }

        .container {
            background: #ffffff;
            padding: 20px 30px;
            border-radius: 10px;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
            text-align: center;
            max-width: 400px;
            width: 100%;
        }

        h1 {
            color: #38a169;
            font-size: 24px;
            margin-bottom: 15px;
        }

        p {
            font-size: 16px;
            margin-bottom: 20px;
            line-height: 1.5;
        }

        label {
            font-size: 18px;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 10px;
            margin-bottom: 15px;
        }

        input {
            font-size: 16px;
            padding: 5px;
        }

        #lockToggle {
            width: 24px;
            height: 24px;
            cursor: pointer;
        }

        #statusMessage {
            font-size: 16px;
            font-weight: bold;
            color: #38a169;
        }

        button {
            background-color: #38a169;
            color: white;
            border: none;
            padding: 10px 15px;
            font-size: 16px;
            cursor: pointer;
            border-radius: 5px;
            margin-top: 10px;
        }

        button:hover {
            background-color: #2e7d32;
        }

        .footer {
            margin-top: 20px;
            font-size: 12px;
            color: #666;
        }

        .ronde-knop {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 20px 30px;
            background-color: #388e3c;
            border-radius: 50px;
            z-index: 1000;
            color: white;
            font-size: 16px;
            text-align: center;
            text-decoration: none;
            font-family: Arial, sans-serif;
        }

        .ronde-knop:hover {
            background-color: #2e7d32;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Hallo Ouders!</h1>
        <p>Hier kan je mijn laptop vergrendelen of ontgrendelen door het vinkje hieronder te gebruiken.</p>

        <label>
            Vergrendeld:
            <input type="checkbox" id="lockToggle">
        </label>

        <p id="statusMessage"></p>

        <div class="footer">© 2025 Wilco Joosen. Alle rechten voorbehouden.</div>
    </div>

    <a href="/laptop/logout/" class="ronde-knop">Logout</a>

    <script>
        const socket = io();
        const lockToggle = document.getElementById('lockToggle');
        const statusMessage = document.getElementById('statusMessage');
        let currentStatus = false;

        socket.on('connect', () => {
            socket.emit('getStatus');
        });

        socket.on('status', (data) => {
            currentStatus = data.locked;
            lockToggle.checked = currentStatus;
            statusMessage.textContent = currentStatus ? 'Apparaat is vergrendeld' : 'Apparaat is ontgrendeld';
        });

        lockToggle.addEventListener('change', (e) => {
            const newStatus = e.target.checked;
            socket.emit('setStatus', { locked: newStatus });
        });
    </script>
</body>
</html>
```
Al moet er dan wel een stukje `socket.io` in het hoofdbestand staan:
```js
io.on("connection", (socket) => {
    const status = readStatus();
    socket.emit("status", status);

    socket.on("getStatus", () => {
        const status = readStatus();
        socket.emit("status", status);
    });

    socket.on("setStatus", (data) => {
        const { locked } = data;
        if (typeof locked !== "boolean") return;

        writeStatus({ locked });
        io.emit("status", { locked });
    });
});
```
Er moet ook nog autenticatie in en alles natuurlijk, maar daar bent u vrij in.

## Licentie
Dit project staat volledig op de Apache 2.0 Licensie.
