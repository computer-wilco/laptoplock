const WSwal = Swal.mixin({"theme": "dark"});

function confirmShutdown() {
    WSwal.fire({
        title: 'Weet je het zeker?',
        text: "Je apparaat wordt afgesloten.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Ja, afsluiten',
        cancelButtonText: 'Annuleren'
    }).then((result) => {
        if (result.isConfirmed) {
            window.api.shutdown();
        }
    });
}

function parentAccess() {
    WSwal.fire({
        title: 'Ouder toegang',
        input: 'password',
        inputLabel: 'Voer het wachtwoord in',
        inputPlaceholder: 'Wachtwoord',
        inputAttributes: {
            autocapitalize: 'off',
            autocorrect: 'off'
        },
        showCancelButton: true,
        confirmButtonText: 'Verifiëren',
        cancelButtonText: 'Annuleren',
        preConfirm: (password) => {
            return fetch('https://admin.wilcowebsite.nl/verifieerlaptop.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `password=${encodeURIComponent(password)}`
            })
            .then(response => response.json())
            .then(data => {
                if (!data.success) {
                    throw new Error('Onjuist wachtwoord');
                }
                return data;
            })
            .catch(error => {
                WSwal.showValidationMessage(error.message);
            });
        }
    }).then((result) => {
        if (result.isConfirmed) {
            WSwal.fire({
                title: 'Succes!',
                text: 'Het apparaat is ontgrendeld.',
                icon: 'success'
            });
        }
    });
}

window.api.onMagNiet((data) => {
    WSwal.fire({
        title: 'Niet doen!',
        text: 'Dat mag niet!',
        icon: 'error'
    });
});
