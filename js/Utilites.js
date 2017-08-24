(function ($, DBConfig) {

    'use strict';

    window.Utils = {

        /**
         * Объект подключения к БД
         * @type {IDBWrapper}
         */
        db: null,

        /**
         * jQuery объект модального окна добавления таблицы
         * @type {s}
         */
        _$addStoreModal: $('#edit-store'),

        /**
         * Контейнер строк таблицы добавления/редактирования store
         * @type {DOMNode}
         */
        _editStoreRowsContainer: document.getElementById('edit-store-rows-container'),

        /**
         * Шаблон строки таблицы добавления/редактирования store
         * @type {DOMNode}
         */
        _editStoreRowTpl: document.getElementById('edit-store-rows-container').firstElementChild,

        /**
         * Select списка таблиц
         * @type {DOMNode}
         */
        _selectStoreContainer: document.getElementById('select-store-container'),

        /**
         * Инпут названия таблицы
         * @type {DOMNode}
         */
        _storeNameContainer: document.getElementById('store-name'),

        /**
        * Вывод сообщения об ошибке
        * @param  {String} message
        * @return {undefined}
        */
        triggerError: function (message) {

            alert(message);
            throw new Error(message);
        },

        /**
         * Добавление строки в таблице добавления/редактирования store
         * @return {undefined}
         */
        addEditStoreTableRow: function () {

            this._editStoreRowsContainer
                .appendChild(document.importNode(this._editStoreRowTpl, true));

        },

        addStore: function () {

            var storeName = this._storeNameContainer.value.toString(),
                tr = this._editStoreRowsContainer.querySelectorAll('tr'),
                i, j, td, fields = [], errors = [], tmpVal, that;

            if ( !/^[a-zA-Z_]+$/.test(storeName) ) {
                this.triggerError('Название таблицы должно состоять из латинских букв и знаков _ вместо пробелов. Пожалуйста, проверте правильность введенного названия таблицы');
            }

            if (this.db.getStoresList().indexOf(storeName) !== -1) {
                this.triggerError('Таблица с таким именем уже существует');
            }

            for (i = 0; i < tr.length; i = i + 1) {

                td = tr[i].querySelectorAll('td');
                tmpVal = td[1].firstElementChild.value;
                if (tmpVal !== '') {

                    if (!/^[a-zA-Z_]+$/.test(tmpVal)) {
                        throw new Error('Код поля должен состоять только из латинских букв и знаков _ вместо пробелов');
                    }

                    fields[i] = {code: tmpVal};

                    tmpVal = td[0].firstElementChild.value;
                    if (!/^[а-яА-Яa-zA-Z_]+$/.test(tmpVal)) {
                        this.triggerError('Код поля должен состоять только из букв и знаков _ вместо пробелов');
                    }

                    fields[i].title = tmpVal;

                    fields[i].type = td[2].firstElementChild.value;

                    if (td[3].firstElementChild.checked) {
                        fields[i].uniq = true;
                    } else {
                        fields[i].uniq = false;
                    }

                }
            }

            if (fields.length) {

                that = this;

                this.db.reconnect(function () {

                    this.createStore({
                        name: storeName,
                        fields: fields
                    });

                })
                .then(function () {

                    return that.db.store(DBConfig.STORES_TABLE_NAME).add({
                        name: storeName,
                        fields: fields
                    });
                })
                .then(function () {

                    that._selectStoreContainer.value = '';
                    that._editStoreRowsContainer.innerHTML = '';
                    that.addEditStoreTableRow();
                    that._$addStoreModal.modal('hide');

                })
                .catch(function (message) {

                    that.triggerError(message);
                });

            } else {
                this.triggerError('Правильно заполненых полей для создания таблицы не найдено');
            }
        }

    };

})(jQuery, DBConfig);
