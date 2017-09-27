!function ($, State, Utils) {

    $(document).ready(function () {

        State.cache.define('#row-tpl', function () {

            if (this.cache['#row-tpl'] !== 'object') {
                this.cache['#row-tpl'] = $('#row-tpl');
            }

            return this.cache['#row-tpl'];

        });

        State.db.connect().then(function () {

            var dbStoragesList = State.db.getStoresList(), i, storagesList;

            for (i = 0; i < dbStoragesList.length; i = i + 1) {

                Utils.renderStorageInList(dbStoragesList[i]);
            }

        }).catch(function (message) {
            Utils.triggerError(message);
        });
    });

}(jQuery, State, Utils);
