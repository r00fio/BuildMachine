/**
 * Created by varzinov on 23.06.2015.
 */
var DAORetailLoanService = (function() {

    var getLoanList = function() {
        var response = DAO.invokeUserEntityMethod('getAllLoans');
        if (response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    var getRetailLoanPaymentSchedule = function(loan) {
        var response = DAO.invokeEntityMethod('system', loan.entityKind, 'getRetailLoanPaymentSchedule', loan.uuid);
        if (response.data) {
            response.data = JSON.parse(response.data);
        }
        return response;
    };

    return {
        getLoanList: getLoanList,
        getRetailLoanPaymentSchedule: getRetailLoanPaymentSchedule
    };
})();