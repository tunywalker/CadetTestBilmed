document.addEventListener('DOMContentLoaded', function () {
    var isLoggedIn = localStorage.getItem('isLoggedIn');

    if (isLoggedIn) {// Giriþ yapýldýysa Tabloyu göster 
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
                localStorage.setItem('jwtToken', data.jwtToken);// Giriþ baþarýlýysa tokeni localstorage'de sakla
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

        // Veri alýnýncaya kadar döngüyü çalýþtýr
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
               
                if (data.length == 1)// Yeni kayýt yapýldýðý zaman onu tabloya yazdýr.
                    displayTableData(data);                
                if (data.length > 1) {
                    displayTableData(data);
                    // Sonraki verileri almak için startId'yi güncelle
                    startId += count;
                    // Yeniden veri çek
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
                if (text === 'true') {//Eðer silme iþlemi baþarýlý olduysa o satýrý tablodan sil
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



    function displayTableData(data) {//Verilerin ekrana basýlmasý ve delete butonunun yerleþtirilmesi
        var tableBody = document.querySelector('#data-table tbody');
        data.forEach(function (item) {
            var row = tableBody.insertRow(0);//Döngüde sýralý olan her veriyi 1. satýra yazdýrdýðý için "ID azalan"" olarak sýralanmýþ olmakta.
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
                var rowIndex = this.closest('tr').rowIndex; // Týklanan butonun tablodaki satýr indeksinin alýnmasý              
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
        var row = tableBody.insertRow(10); // 11. satýr oluþtur
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
        // Tabloda satýr kalmadýðýný kontrol et
        if (table.rows.length === 0) {
            return; // Eðer satýr kalmadýysa, sadece dön
        }

        // Eðer kalan satýrlar varsa, sütun baþlýklarýnýn düzenlenemez olmasýný saðla
        var headerRow = table.rows[0]; // Ýlk satýrý al (baþlýk satýrý)
        for (var i = 0; i < headerRow.cells.length; i++) {
            headerRow.cells[i].contentEditable = false; // Baþlýk satýrýndaki tüm hücrelerin contentEditable özelliðini false yap
        }

        // Diðer hücrelerin contentEditable özelliðinin doðru þekilde ayarlandýðýndan emin ol
        for (var i = 1; i < table.rows.length; i++) { // Header satýrýný atlamak için 1'den baþla
            var cells = table.rows[i].cells;
            for (var j = 1; j < cells.length - 1; j++) { // Her satýrýn ilk ve son hücresini atla
                cells[j].contentEditable = true; // Diðer satýrlardaki hücreler için contentEditable özelliðini true yap
            }
        }
    }
    var editStates = {}; // Her satýrýn düzenleme durumunu takip eden nesne

    function editRow(row, clickedCell) {
        var rowId = row.dataset.rowId; // Satýrýn benzersiz kimliðini al
        var cells = row.cells;
        var oldData = [];
        // Eðer bu satýr zaten düzenleniyorsa tekrar düzenleme yapýlmamalý
        if (editStates[rowId]) {
            return;
        }
        // Eski verileri sakla
        for (var i = 1; i < cells.length - 1; i++) {
            oldData.push(cells[i].textContent);
        }

        // Hücreleri düzenlenebilir yap 
        for (var i = 1; i < cells.length - 1; i++) {
            cells[i].contentEditable = true;
            cells[i].addEventListener('blur', function () {
                //Düzenlemeyi bitir 
                endEdit(this, oldData, rowId);
                this.style.backgroundColor = 'white';
            });

        }        
        editStates[rowId] = true;
    }
    var editStates = {};
    function endEdit(cell, oldData, rowId) {//Bir nesne oluþtur ve eðer hücrede deðiþiklik yapýldýysa güncelleme iþlemini baþlat
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
                    cellSetBackground(cell, "lightgreen");//Güncelleme baþarýlýysa hücre arkaplan renginin yeþil yapýlmasý
                    return response.json(); 
                }
                else {

                    cellSetBackground(cell, "red");//Güncelleme baþarýlý olmadýysa hücre arkaplan renginin kýrmýzý yapýlmasý
                    cell.textContent = oldData;//Güncelleme baþarýlý olmadýysa verinin eski haline geri döndürülmesi
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
    //Belirtilen hücrenin arkaplanýný 1 saniyeliðine istenilen renk yapýlmasý
    function cellSetBackground(cell, bgColor) {
        cell.style.backgroundColor = bgColor;       
        setTimeout(function () {
            cell.style.backgroundColor = 'white';
        }, 1000);
    }

    var addNewProgress = 0;
    document.getElementById('newButton').addEventListener('click', function () {

        if (addNewProgress == 0) {//Eðer kaydetme iþlemi devam etmiyorsa yeni satýr ekle
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
        var row = tableBody.insertRow(0); // Yeni satýr ekle
        // Boþ hücreler oluþtur ve düzenlenebilir yap
        for (var i = 0; i < 5; i++) {
            var cell = row.insertCell(i);
            if (i === 0) {
                cell.textContent = '#';
            } else {
                cell.textContent = '';
                cell.contentEditable = true;
            }
        }
        // Save ve Cancel butonlarýný içermek üzere div oluþturulmasý
        var buttonDiv = document.createElement('div');

        // Save button oluþturulmasý
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
        //Cancel ve Save butonlarýnýn hücreye eklenmesi
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
            .then(responseData => {//Eðer kayýt baþarýlý ise 0 dan büyük bir deðer (kaydedilen deðer idsi) döndürür.
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
