
window.State = (function (IDBWrapper, Cache) {

    'use strict';

    // состояние приложения
    var State = {

        /**
        * Название базы данных (латиницей)
        * @type {String}
        */
        dbname: 'IDBMA',

        /**
        * Название таблицы для хранинение информации по таблицам системы
        * @type {String}
        */
        stcname: 'stores_table',

        /**
        * Объект подключения к БД
        * @type {IDBWrapper}
        */
        db: null,

        /**
        * Текущая таблица
        * @type {String}
        */
        currentStorage: null,

        /**
        * Количество элементов на странице
        * @type {Number}
        */
        pageSize: 10,

        /**
        * Текущая страница
        * @type {Number}
        */
        currentPage: 1

    };

    // создание объекта БД
    State.db = new IDBWrapper(State.dbname, null, function () {

        this.createStore({
            name: State.stcname,
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

    // создание объекта кеширования
    State.cache = new Cache();

    return State;

})(IDBWrapper, Cache);
