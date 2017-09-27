window.Utils = (function ($, State) {

    'use strict';

    return {

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
        * Отрисовка таблицы данных
        * @param  {Object} tableDesc
        */
        renderStorageTable: function (tableDesc) {

            if (typeof State.cache['#data-area'] !== 'object') {
                State.cache['#data-area'] = $('#data-area');
            }

            if (typeof State.cache[tableDesc.name] === 'string') {
                // рендерим таблицу из кеша
                State.cache['#data-area'].html(State.cache[tableDesc.name]);
            } else {
                // получаем данные текущей таблицы
                State.db.store(tableDesc.name).get()
                .then(function (tableData) {

                    var table = '<table class="table">\
                    <thead>\
                    <tr>\
                    <td class="pr-0 text-right" colspan="'+(tableDesc.fields.length + 1)+'">\
                    <button onclick="Utils.renderElementModal()" data-toggle="modal" data-target="#add-storage-element" class="btn btn-success">\
                    + Добавить элемент\
                    </button>\
                    </td>\
                    </tr><tr>',
                    i = 0, j = 0;

                    for (i = 0; i < tableDesc.fields.length; i = i + 1) {
                        table += '<td><b>'+(typeof tableDesc.fields[i].title === 'string' ? tableDesc.fields[i].title : tableDesc.fields[i].code)+'</b></td>';
                    }

                    table += '</tr></thead><tbody>';

                    if (tableData.length > 0) {
                        for (i = 0; i < tableData.length; i = i + 1) {
                            table += '<tr>';
                            for (j = 0; j < tableDesc.fields.length; j = j + 1) {
                                table += '<td>'+tableData[i][tableDesc[j].code]+'</td>';
                            }
                            table += '<td>\
                            <button class="btn btn-primary">Редактировать</button>\
                            <button class="btn btn-danger">Удалить</button>\
                            </td>\
                            </tr>';
                        }
                    }

                    table += '</tbody></table>';

                    State.cache['#data-area'].html(table);
                    State.cache[tableDesc.name] = table;
                })
                .catch(function (message) {
                    Utils.triggerError(message);
                });
            }

        },

        /**
        * Добавляет возможность выбора таблицы
        * @param  {String} storage
        */
        renderStorageInList: function (storage, isSelected) {

            if (typeof State.cache['#select-storage-container'] !== 'object') {
                State.cache['#select-storage-container'] = $('#select-storage-container');
            }

            if (
                !State.cache['#select-storage-container'].find('option[value='+storage+']').length &&
                storage !== State.stcname
            ) {
                State.cache['#select-storage-container'].append('<option '+(isSelected ? 'selected=""' : '')+' value="'+storage+'">'+storage+'</option>');
            }

        },

        /**
        * Добавляет строку полей описания таблицы
        */
        renderStorageModal: function () {

            if (typeof State.cache['#row-tpl'] !== 'object') {
                State.cache['#row-tpl'] = $('#row-tpl');
            }

            if (typeof State.cache['row-tpl-string'] !== 'string') {
                State.cache['row-tpl-string'] = State.cache['#row-tpl'].html();
            }

            State.cache['#row-tpl'].append(State.cache['row-tpl-string']);
        },

        /**
        * Отрисовывает html контент для модального окно добавления элемента таблицы
        */
        renderElementModal: function (elementId) {

            var i, html = '';

            if (typeof State.cache['#add-storage-element'] !== 'object') {
                State.cache['#add-storage-element'] = $('#add-storage-element').find('.modal-body');
            }

            if (typeof State.cache['element-modal-' + State.currentStorage + '-' + (elementId || 0)] !== 'string') {

                State.db.store(State.stcname).where('name').equal(State.currentStorage)
                .get().then(function (tableDesc) {

                    if (elementId > 0) {

                        State.db.store(State.currentStorage).where('id')
                        .equal(elementId).get().then(function (data) {
                            for (i = 0; i < tableDesc[0].fields.length; i = i + 1) {

                                if (fields[i].code === 'id') {
                                    continue;
                                }

                                if (tableDesc[0].fields[i].type === 'String') {
                                    html += '<div class="form-group">';
                                    html += '<label>'+(tableDesc[0].fields[i].title || tableDesc[0].fields[i].code)+'</label>';
                                    html += '<input class="form-control" name="'+tableDesc[0].fields[i].code+'" value="'+data[tableDesc[0].fields[i].code]+'" type="text">';
                                    html += '</div>';
                                } else if (tableDesc[0].fields[i].type === 'Boolean') {
                                    html += '<div class="checkbox">';
                                    html += '<label>';
                                    html += '<input value="Y" type="checkbox"> <b>' + tableDesc[0].fields[i].title + '</b>'
                                    html += '</label>';
                                    html += '</div>';
                                } else if (tableDesc[0].fields[i].type === 'Text') {
                                    html += '<div class="form-group">';
                                    html += '<label>'+(tableDesc[0].fields[i].title || tableDesc[0].fields[i].code)+'</label>';
                                    html += '<textarea class="form-control" cols="15" rows="10" name="'+tableDesc[0].fields[i].code+'" >'+data[tableDesc[0].fields[i].code]+'</textarea>';
                                    html += '</div>';
                                }
                            }

                            State.cache['element-modal-' + State.currentStorage + '-' + elementId] = html;
                            State.cache['#add-storage-element'].html(State.cache['element-modal-' + State.currentStorage + '-' + elementId]);
                        });

                    } else {
                        for (i = 0; i < tableDesc[0].fields.length; i = i + 1) {

                            if (tableDesc[0].fields[i].code === 'id') {
                                continue;
                            }

                            if (tableDesc[0].fields[i].type === 'String') {
                                html += '<div class="form-group">';
                                html += '<label>'+(tableDesc[0].fields[i].title || tableDesc[0].fields[i].code)+'</label>';
                                html += '<input class="form-control" name="'+tableDesc[0].fields[i].code+'" type="text">';
                                html += '</div>';
                            } else if (tableDesc[0].fields[i].type === 'Boolean') {
                                html += '<div class="checkbox">';
                                html += '<label>';
                                html += '<input value="Y" type="checkbox"> <b>' + tableDesc[0].fields[i].title + '</b>'
                                html += '</label>';
                                html += '</div>';
                            } else if (tableDesc[0].fields[i].type === 'Text') {
                                html += '<div class="form-group">';
                                html += '<label>'+(tableDesc[0].fields[i].title || tableDesc[0].fields[i].code)+'</label>';
                                html += '<textarea class="form-control" cols="15" rows="10" name="'+tableDesc[0].fields[i].code+'" ></textarea>';
                                html += '</div>';
                            }

                        }

                        State.cache['element-modal-' + State.currentStorage + '-0'] = html;
                        State.cache['#add-storage-element'].html(State.cache['element-modal-' + State.currentStorage + '-0']);
                    }

                }).catch(function (message) {
                    Utils.triggerError(message);
                });
            } else {
                State.cache['#add-storage-element'].html(State.cache['element-modal-' + State.currentStorage + '-' + elementId]);
            }
        },

        selectStorage: function () {

        },

        addElement: function () {


        },

        updateElement: function () {

        },

        deleteElement: function () {

        },

        addStorage: function () {

            var storageName = null;
            var tr = null;
            var i, j;
            var fields = [];
            var errors = [];
            var tmpVal = null;
            var that = null;

            if (typeof State.cache['#row-tpl'] !== 'object') {
                State.cache['#row-tpl'] = $('#row-tpl');
            }

            if (typeof State.cache['#storage-name'] !== 'object') {
                State.cache['#storage-name'] = $('#storage-name');
            }

            storageName = State.cache['#storage-name'].val().toString().toLowerCase(),
            tr = State.cache['#row-tpl'].find('tr');

            if ( !/^[a-z]+$/.test(storageName) ) {
                this.triggerError('Название таблицы должно состоять из латинских букв и знаков _ вместо пробелов. Пожалуйста, проверте правильность введенного названия таблицы');
            }

            if (State.db.getStoresList().indexOf(storageName) !== -1) {
                this.triggerError('Таблица с таким именем уже существует');
            }

            tr.each(function (i) {

                var $this = $(this),
                td = $this.find('td'),
                tmpVal = td.eq(1).find('input[type=text]').val();
                if (tmpVal !== '') {

                    if (!/^[a-zA-Z_]+$/.test(tmpVal)) {
                        throw new Error('Код поля должен состоять только из латинских букв и знаков _ вместо пробелов');
                    }

                    fields[i] = {code: tmpVal};

                    tmpVal = td.eq(0).find('input[type=text]').val();
                    if (!/^[а-яА-Яa-zA-Z_]+$/.test(tmpVal)) {
                        this.triggerError('Код поля должен состоять только из букв и знаков _ вместо пробелов');
                    }

                    fields[i].title = tmpVal;

                    fields[i].type = td.eq(2).find('select').val();

                    if (td.eq(3).find('input[type=checkbox]').is(':checked')) {
                        fields[i].uniq = true;
                    } else {
                        fields[i].uniq = false;
                    }

                }
            });

            if (fields.length) {

                State.db.createNewStore({
                    name: storageName,
                    fields: fields
                })
                .then(function () {

                    return State.db.store(State.stcname).add({
                        name: storageName,
                        fields: fields
                    });
                })
                .then(function () {

                    if (typeof State.cache['#row-tpl'] !== 'object') {
                        State.cache['#row-tpl'] = $('#row-tpl');
                    }
                    State.cache['#row-tpl'].html('');
                    Utils.renderStorageModal();
                    if (typeof State.cache['#add-storage'] !== 'object') {
                        State.cache['#add-storage'] = $('#add-storage');
                    }
                    State.cache['#add-storage'].modal('hide');
                    Utils.renderStorageInList(storageName, true);
                    State.cache['#select-storage-container'].val(storageName);
                    State.cache['#select-storage-container'].trigger('change');
                })
                .catch(function (message) {

                    Utils.triggerError(message);
                });

            } else {
                Utils.triggerError('Правильно заполненых полей для создания таблицы не найдено');
            }

        },

        deleteStorage: function () {

        },

        /**
        * Обработка выбора таблицы данных
        */
        choiceOfStorage: function (that) {

            State.currentStorage = that.value;

            if (typeof State.cache['#data-area'] !== 'object') {
                State.cache['#data-area'] = $('#data-area');
            }

            State.cache['#data-area'].html('');

            if (State.currentStorage) {

                // получаем описание текущей таблицы
                State.db.store(State.stcname)
                .where("name")
                .equal(State.currentStorage)
                .get()
                .then(function (tableDesc) {
                    Utils.renderStorageTable(tableDesc[0]);
                })
                .catch(function (message) {
                    Utils.triggerError(message);
                });

            }
        }
    };

})(jQuery, State);
