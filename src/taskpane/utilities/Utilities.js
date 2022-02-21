
export default class utilities {

    static getColor(string) {
        if (string == "modro" || string == "modre" || string == "modra") {
            return "#4460db"
        } else if (string == "črno" || string == "črne" || string == "črna") {
            return "black"
        } else if (string == "zeleno" || string == "zelene" || string == "zelena") {
            return "green"
        } else if (string == "rdečo" || string == "rdeče" || string == "rdeča") {
            return "#c73c3c"
        } else if (string == "rumeno" || string == "rumene" || string == "rumena") {
            return "#bfb750" 
        } else {
            return null
        }
    }
    
    static getNumber(string) {
        if (string === "1" || string === "ena" || string === "en" || string === "eno" ) {
            return 1
        } else if (string === "2" || string === "dva" || string === "dve") {
            return 2
        } else if (string === "3" || string === "tri") {
            return 3
        } else if (string === "4" || string === "štiri") {
            return 4
        } else if (string === "5" || string === "pet") {
            return 5
        } else if (string === "6" || string === "šest") {
            return 6
        } else if (string === "7" || string === "sedem") {
            return 7
        } else if (string === "8" || string === "osem") {
            return 8
        } else if (string === "9" || string === "devet") {
            return 9
        } else if (string === "10" || string === "deset") {
            return 10
        } else if (!isNaN(string)) {
            return parseInt(string)
        }
    }
    
    static isCrka(string) {
        return string == "črke" || string == "črko" || string == "črka"
    }

    static isNumber(string) {
        if (string === "1" || string === "ena" || string === "en" || string === "eno" 
        ||	string === "2" || string === "dva" || string === "dve" 
        || string === "3" || string === "tri"
        || string === "4" || string === "štiri"
        || string === "5" || string === "pet"
        || string === "6" || string === "šest"
        || string === "7" || string === "sedem"
        || string === "8" || string === "osem"
        || string === "9" || string === "devet"
        || string === "10" || string === "deset"
        || !isNaN(string)) {
            return true
        }
        return false
    }
    
}