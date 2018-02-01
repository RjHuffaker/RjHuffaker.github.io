function autoDepunctuationinator(){
	var editButton = document.getElementById("butEdit");
	var saveButton = document.getElementById("butSave");
	var addressInput = document.getElementById("Address");
	var streetLabel, streetSearchLabel, streetSearchInput;
	var directionsInput;

	if(window.location.href.indexOf("billto/edit.asp") > -1){
		if(addressInput.value.indexOf(".") > -1){
			streetLabel = addressInput.parentElement.previousElementSibling;
			addressInput.value = addressInput.value.replaceAll(".", "");
			streetLabel.style.color = "red";
			streetLabel.style.fontWeight = "bold";

			editButton.style.border = "2px solid red";
			saveButton.style.border = "2px solid red";
		}
	} else if(window.location.href.indexOf("location/edit.asp") > -1){
		streetSearchInput = document.getElementById("Street");
		directionsInput = document.getElementById("Directions");

		if(addressInput.value.indexOf(".") > -1){

			streetLabel = addressInput.parentElement.previousElementSibling;
			addressInput.value = addressInput.value.replaceAll(".", "");
			streetLabel.style.color = "red";
			streetLabel.style.fontWeight = "bold";

			streetSearchLabel = streetSearchInput.parentElement.previousElementSibling;
			streetSearchInput.value = streetSearchInput.value.replaceAll(".", "");
			streetSearchLabel.style.color = "red";
			streetSearchLabel.style.fontWeight = "bold";

			saveButton.style.border = "2px solid red";

		}

		directionsInput.value = directionsInput.value.replace("scorpions txt reminders", "TEXT REMINDERS - Scorpions");

		directionsInput.value = directionsInput.value.replace("scorpions text reminders", "TEXT REMINDERS - Scorpions");

		if(!directionsInput.value.match(/\*/g)){

			directionsInput.value = "** "+directionsInput.value;

		}
	}
}