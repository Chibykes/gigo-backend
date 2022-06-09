var genFunctions = {
    genUppercase: function (){
        return String.fromCharCode(Math.floor((Math.random() * 26) + 65));
    },
    genLowercase: function (){
        return String.fromCharCode(Math.floor((Math.random() * 26) + 97));
    },
    genNumber: function (){
        return String.fromCharCode(Math.floor((Math.random() * 10) + 48));
    },
    genSymbol: function (){
        let symbols = '!@#$%&*()-_+=|{}[].,;:'
        return symbols.charAt(Math.floor((Math.random() * 22)));
    }
}


module.exports = function genRandomString(genFunctionsArray, length){
    if (!length){ length = 10; }
    var genString = '';
    for(i=0; i<length; i++){
        genString = genString.concat(genFunctions[genFunctionsArray[Math.floor(Math.random() * genFunctionsArray.length)]]());
    }
    return genString;
}