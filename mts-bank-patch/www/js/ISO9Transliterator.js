var ISO9Transliterator = (function () {

    // Транслитерация согласно алгоритму от банка. Запрос 094823: MTS-OPE: Транслитерация буквы "Х"
    var rus = "А Б В Г Д Е Ё Ж  З И Й К Л М Н О П Р С Т У Ф Х  Ц  Ч  Ш  Щ    Ъ  Ы Ь  Э Ю  Я".split(/ +/g);
    var eng = "A B V G D E E ZH Z I I K L M N O P R S T U F KH TC CH SH SHCH \0 Y \0 E IU IA".split(/ +/g);

    var transliterate = function (text, engToRus) {
        var x;
        for (x = 0; x < rus.length; x++) {
            text = text.split(engToRus ? eng[x] : rus[x]).join(engToRus ? rus[x] : eng[x]);
            text = text.split(engToRus ? eng[x].toLowerCase() : rus[x].toLowerCase()).join(engToRus ? rus[x].toLowerCase() : eng[x].toLowerCase());
        }
        return text;
    };

    return {
        transliterate: transliterate
    }

})();
