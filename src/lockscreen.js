function confirmShutdown() {
    Swal.fire({
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
    Swal.fire({
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
            return fetch('https://wilcoadmin.djoamersfoort.nl/verifieerlaptop.php', {
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
                Swal.showValidationMessage(error.message);
            });
        }
    }).then((result) => {
        if (result.isConfirmed) {
            fetch('https://wapi.djoamersfoort.nl/laptop/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({locked : false})
            });

            Swal.fire({
                title: 'Succes!',
                text: 'Het apparaat is ontgrendeld.',
                icon: 'success'
            });
        }
    });
}