document.addEventListener('DOMContentLoaded', function () {
    var isLoggedIn = localStorage.getItem('isLoggedIn');

    if (isLoggedIn) {// Giri� yap�ld�ysa Tabloyu g�ster 
        showTable();
    } else {
        showLoginForm();
    }
    document.getElementById('loginForm').addEventListener('submit', function (event) {
        event.preventDefault();
        var username = document.getElementById('username').value;
        var password = document.getElementById('password').value;
        var apiUrl = '/api/User/authenticate';

        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        })
            .then(response => {
                if (response.ok) {
                    return response.json();
                }
                throw new Error('Authentication failed.');
            })
            .then(data => {
                localStorage.setItem('jwtToken', data.jwtToken);// Giri� ba�ar�l�ysa tokeni localstorage'de sakla
                localStorage.setItem('isLoggedIn', true);
                showTable();
            })
            .catch(error => {
                console.error(error);
                document.getElementById('errorLabel').textContent = 'Invalid username or password.';
            });
    });
    document.getElementById('logoutButton').addEventListener('click', function () {
        localStorage.removeItem('isLoggedIn');
        showLoginForm();
    });

    function showTable() {
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('tableSection').style.display = 'block';
        document.getElementById('logoutButton').style.display = 'block';
        fetchDataAndDisplayTable();
    }

    function showLoginForm() {
        document.getElementById('loginSection').style.display = 'block';
        document.getElementById('tableSection').style.display = 'none';
        document.getElementById('logoutButton').style.display = 'none';
    }

    function fetchDataAndDisplayTable() {
        var apiUrl = '/api/Consents';
        var startId = 1;
        var count = 10;

        // Veri al�n�ncaya kadar d�ng�y� �al��t�r
        fetchConsentData(apiUrl, startId, count);
    }

    function fetchConsentData(apiUrl, startId, count) {//Recursive 
        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('jwtToken')
            },
            body: JSON.stringify({
                startId: startId,
                count: count
            })
        })
            .then(response => {
                if (response.ok) {
                    return response.json();
                }
                throw new Error('Failed to fetch data.');
            })
            .then(data => {
               
                if (data.length == 1)// Yeni kay�t yap�ld��� zaman onu tabloya yazd�r.
                    displayTableData(data);                
                if (data.length > 1) {
                    displayTableData(data);
                    // Sonraki verileri almak i�in startId'yi g�ncelle
                    startId += count;
                    // Yeniden veri �ek
                    fetchConsentData(apiUrl, startId, count);                  
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    function removeConsent(consentId, rowIndex) {
        var jwtToken = localStorage.getItem('jwtToken');
        var deleteUrl = '/api/Consents/Delete?id=' + consentId;
        fetch(deleteUrl, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer' + jwtToken,
                'Content-Type': 'application/json'
            }
        })
            .then(response => response.text())
            .then(text => {
                if (text === 'true') {//E�er silme i�lemi ba�ar�l� olduysa o sat�r� tablodan sil
                    console.log('Deleted Successfully');
                    deleteRow(rowIndex);
                } else {
                    throw new Error('Delete operation failed');
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }



    function displayTableData(data) {//Verilerin ekrana bas�lmas� ve delete butonunun yerle�tirilmesi
        var tableBody = document.querySelector('#data-table tbody');
        data.forEach(function (item) {
            var row = tableBody.insertRow(0);//D�ng�de s�ral� olan her veriyi 1. sat�ra yazd�rd��� i�in "ID azalan"" olarak s�ralanm�� olmakta.
            var cell1 = row.insertCell(0);
            var cell2 = row.insertCell(1);
            var cell3 = row.insertCell(2);
            var cell4 = row.insertCell(3);
            var cell5 = row.insertCell(4);
            var cell6 = row.insertCell(5);
            //Delete Button
            var deleteButton = document.createElement('button');
            deleteButton.className = 'button delete';
            deleteButton.onclick = function () {
                var consentId = this.getAttribute('data-item-id');
                var rowIndex = this.closest('tr').rowIndex; // T�klanan butonun tablodaki sat�r indeksinin al�nmas�              
                removeConsent(consentId, rowIndex);
            };
            deleteButton.dataset.itemId = item.id;
            deleteButton.textContent = 'Delete';
            row.addEventListener('click', function () {
                var clickedCell = event.target;
                editRow(this, clickedCell);
            });
            cell1.textContent = item.id;
            cell2.textContent = item.type;
            cell3.textContent = item.recipient;
            cell4.textContent = item.status;
            cell5.textContent = item.recipientType;
            cell6.appendChild(deleteButton);
        });
        
        if (data.length > 9)
            addTimeRow(tableBody);
    }

    function addTimeRow(tableBody) {// Saat bilgisinin eklenmesi
        var row = tableBody.insertRow(10); // 11. sat�r olu�tur
        var cell1 = row.insertCell(0);
        var cell2 = row.insertCell(1);
        var cell3 = row.insertCell(2);
        var timeCell = row.insertCell(2); 
        var currentDate = new Date();
        var timeString = currentDate.toLocaleTimeString();
        timeCell.textContent = timeString; 
    }
    function deleteRow(rowIndex) {
        var table = document.getElementById('data-table');
        table.deleteRow(rowIndex);
        // Tabloda sat�r kalmad���n� kontrol et
        if (table.rows.length === 0) {
            return; // E�er sat�r kalmad�ysa, sadece d�n
        }

        // E�er kalan sat�rlar varsa, s�tun ba�l�klar�n�n d�zenlenemez olmas�n� sa�la
        var headerRow = table.rows[0]; // �lk sat�r� al (ba�l�k sat�r�)
        for (var i = 0; i < headerRow.cells.length; i++) {
            headerRow.cells[i].contentEditable = false; // Ba�l�k sat�r�ndaki t�m h�crelerin contentEditable �zelli�ini false yap
        }

        // Di�er h�crelerin contentEditable �zelli�inin do�ru �ekilde ayarland���ndan emin ol
        for (var i = 1; i < table.rows.length; i++) { // Header sat�r�n� atlamak i�in 1'den ba�la
            var cells = table.rows[i].cells;
            for (var j = 1; j < cells.length - 1; j++) { // Her sat�r�n ilk ve son h�cresini atla
                cells[j].contentEditable = true; // Di�er sat�rlardaki h�creler i�in contentEditable �zelli�ini true yap
            }
        }
    }
    var editStates = {}; // Her sat�r�n d�zenleme durumunu takip eden nesne

    function editRow(row, clickedCell) {
        var rowId = row.dataset.rowId; // Sat�r�n benzersiz kimli�ini al
        var cells = row.cells;
        var oldData = [];
        // E�er bu sat�r zaten d�zenleniyorsa tekrar d�zenleme yap�lmamal�
        if (editStates[rowId]) {
            return;
        }
        // Eski verileri sakla
        for (var i = 1; i < cells.length - 1; i++) {
            oldData.push(cells[i].textContent);
        }

        // H�creleri d�zenlenebilir yap 
        for (var i = 1; i < cells.length - 1; i++) {
            cells[i].contentEditable = true;
            cells[i].addEventListener('blur', function () {
                //D�zenlemeyi bitir 
                endEdit(this, oldData, rowId);
                this.style.backgroundColor = 'white';
            });

        }        
        editStates[rowId] = true;
    }
    var editStates = {};
    function endEdit(cell, oldData, rowId) {//Bir nesne olu�tur ve e�er h�crede de�i�iklik yap�ld�ysa g�ncelleme i�lemini ba�lat
        var newData = cell.textContent;
        var row = cell.parentNode;        
        if (editStates[rowId]) {           
            cell.contentEditable = true;            
            editStates[rowId] = false;           
            var updatedData = {};
            updatedData.id = row.cells[0].textContent; 
            updatedData.type = row.cells[1].textContent;
            updatedData.recipient = row.cells[2].textContent;
            updatedData.status = row.cells[3].textContent;
            updatedData.recipientType = row.cells[4].textContent;
            
            if (oldData[cell.cellIndex - 1] != newData) {
                sendUpdatedData(updatedData, rowId, cell, oldData[cell.cellIndex - 1]);
            }
        }
    }


    function sendUpdatedData(data, rowId, cell, oldData) {    
        var apiUrl = '/api/Consents/Update';
        const jsonString = `{
        "id": ${data.id},
        "type": "${data.type}",
        "recipient": "${data.recipient}",
        "status": "${data.status}",
        "recipientType": "${data.recipientType}"
    }`;
        fetch(apiUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('jwtToken')
            },
            body: jsonString
        })
            .then(response => {
                if (response.ok) {                   
                    cellSetBackground(cell, "lightgreen");//G�ncelleme ba�ar�l�ysa h�cre arkaplan renginin ye�il yap�lmas�
                    return response.json(); 
                }
                else {

                    cellSetBackground(cell, "red");//G�ncelleme ba�ar�l� olmad�ysa h�cre arkaplan renginin k�rm�z� yap�lmas�
                    cell.textContent = oldData;//G�ncelleme ba�ar�l� olmad�ysa verinin eski haline geri d�nd�r�lmesi
                    cell.contentEditable = true;
                }

            })
            .then(responseData => {
                console.log(responseData);    
            })
            .catch(error => {
                console.error(error);
            });
    }
    //Belirtilen h�crenin arkaplan�n� 1 saniyeli�ine istenilen renk yap�lmas�
    function cellSetBackground(cell, bgColor) {
        cell.style.backgroundColor = bgColor;       
        setTimeout(function () {
            cell.style.backgroundColor = 'white';
        }, 1000);
    }

    var addNewProgress = 0;
    document.getElementById('newButton').addEventListener('click', function () {

        if (addNewProgress == 0) {//E�er kaydetme i�lemi devam etmiyorsa yeni sat�r ekle
            console.log("0");
            addNewRow();
            addNewProgress = 1;
        }
        else {
            alert("Please complete the data entry or press the cancel button.");
        }
    });
    function addNewRow() {
        var tableBody = document.querySelector('#data-table tbody');
        var row = tableBody.insertRow(0); // Yeni sat�r ekle
        // Bo� h�creler olu�tur ve d�zenlenebilir yap
        for (var i = 0; i < 5; i++) {
            var cell = row.insertCell(i);
            if (i === 0) {
                cell.textContent = '#';
            } else {
                cell.textContent = '';
                cell.contentEditable = true;
            }
        }
        // Save ve Cancel butonlar�n� i�ermek �zere div olu�turulmas�
        var buttonDiv = document.createElement('div');

        // Save button olu�turulmas�
        var saveButton = document.createElement('button');
        saveButton.className = 'button save';
        saveButton.textContent = 'Save';
        saveButton.onclick = function () {
            var addData = {};
            addData.type = row.cells[1].textContent;
            addData.recipient = row.cells[2].textContent;
            addData.status = row.cells[3].textContent;
            addData.recipientType = row.cells[4].textContent;
            saveRow(addData, row);
        };
        var cancelButton = document.createElement('button');
        cancelButton.className = 'button cancel';
        cancelButton.textContent = 'Cancel';
        cancelButton.onclick = function () {
            deleteRow(1);
            addNewProgress = 0;
        };
        buttonDiv.style.display = 'inline-block';
        buttonDiv.style.width = '160px';
        //Cancel ve Save butonlar�n�n h�creye eklenmesi
        buttonDiv.appendChild(cancelButton);
        buttonDiv.appendChild(saveButton);
        var cell = row.insertCell(5);
        cell.appendChild(buttonDiv);
    }





    function saveRow(data, row) {
        var apiUrl = '/api/Consents/Add';
        const jsonString = JSON.stringify(data);
        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('jwtToken')
            },
            body: jsonString
        })
            .then(response => {
                if (response.ok) {

                    return response.json();
                } else {

                    alert("An error occurred while adding the data.");
                }
            })
            .then(responseData => {//E�er kay�t ba�ar�l� ise 0 dan b�y�k bir de�er (kaydedilen de�er idsi) d�nd�r�r.
                if (responseData > 1) {
                    addNewProgress = 0;
                    deleteRow(1);
                    fetchConsentData("/api/Consents/", responseData, 1);
                    console.log(responseData);
                }
            })
            .catch(error => {
                console.error(error);
            });
    }




});
