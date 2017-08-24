/**
* Создание БД
* таблицы списка таблиц (stores_table)
* подключение к БД и инициализация приложения
*/
$(document).ready(function () {

    'use strict';

    Utils.db = new IDBWrapper(DBConfig.DBNAME, null, function () {

        this.createStore({
            name: DBConfig.STORES_TABLE_NAME,
            fields: [
                {
                    code: 'name',
                    uniq: true
                },
                {
                    code: 'fields',
                    uniq: false
                }
            ]
        });
    });

    Utils.db.connect()
        .then(function () {

        })
        .catch(function (message) {

            Utils.triggerError(message);
        });
});
