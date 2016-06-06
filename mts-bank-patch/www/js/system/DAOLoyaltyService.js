/**
 * Created by Varzinov on 08.09.2015.
 */
var DAOLoyaltyService = (function () {
    var getBonusInfo = function(){
        return DAO.invokeUserEntityMethodAsync('getBonusInfo').then(function(response){
            if (!response.code && response.data) {
                response.data = JSON.parse(response.data);
            }
            return response;
        });
    };

    var getPromosInfo = function(){
        return DAO.invokeUserEntityMethodAsync('getPromosInfo').then(function(response){
            if (!response.code && response.data) {
                response.data = JSON.parse(response.data);
            }
            return response;
        });
    };

    var getPartnersInfo = function(){
        return DAO.invokeUserEntityMethodAsync('getPartnersInfo').then(function(response){
            if (!response.code && response.data) {
                response.data = JSON.parse(response.data);
            }
            return response;
        });
    };

    var getSourceListForOption = function(optionStrId) {
        return DAO.invokeUserEntityMethodAsync('getSourceListForOption', optionStrId).then(function(response){
            if (!response.code && response.data) {
                response.data = JSON.parse(response.data);
            }
            return response;
        });
    };

    return {
        getBonusInfo: getBonusInfo,
        getPromosInfo: getPromosInfo,
        getPartnersInfo: getPartnersInfo,
        getSourceListForOption: getSourceListForOption
    };
})();