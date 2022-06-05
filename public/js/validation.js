function check_email(input) {
    var email = /^[a-z0-9]{1,}[a-z0-9._]{0,}@[a-z0-9]{1,}[.]{1}[a-z0-9.]{2,}$/
    if(email.test(input.value)){
        input.setCustomValidity("");
    }
    else
    {
        input.setCustomValidity("Invalid Email Format");
        //return true;
    }
    
}
function check_phone(input){
    var phone = Number(input.value);

    if(phone > 5000000000 && phone < 9999999999)    
    {
        input.setCustomValidity("");

    }
    else
    {
        input.setCustomValidity("Invalid Phone Number");

    }
}
function CHECK_PIN(input){
    var pin = Number(input.value);
    if(pin < 999999 && pin > 100000){
        input.setCustomValidity("");
    }
    else{
        input.setCustomValidity("Invalid PIN Code");
    }

}
