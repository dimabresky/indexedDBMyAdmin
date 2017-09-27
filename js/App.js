
function App (Cache, IDBWrapper, $) {

    this.state = {

        /**
        * Название базы данных (латиницей)
        * @type {String}
        */
        DBNAME: 'IDBMA',

        /**
        * Название таблицы для хранинение информации по таблицам системы
        * @type {String}
        */
        stcname: 'stores_table',

        /**
         * Название текущей таблицы приложения
         * @type {String}
         */
        currentStorage: null
    };

    /**
     * Объект кеширования
     * @type {Cache}
     */
    this.cache = new Cache();

    /**
     * Объект базы данных
     * @type {IDBWrapper}
     */
    this.db = new IDBWrapper(this.state.DBNAME, null, function () {

        this.createStore({
            name: this.state.stcname,
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

    /**
    * Отрисовка таблицы данных
    * @param  {Object} tableDesc
    */
    this.renderStorageTable = function (tableDesc) {

        var _this = this;

        if (typeof _this.cache.get(tableDesc.name) === 'string') {
            // рендерим таблицу из кеша
            _this.cache['#data-area'].html(_this.cache.get(tableDesc.name));
        } else {
            // получаем данные текущей таблицы
            _this.db.store(tableDesc.name).get()
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

                _this.cache['#data-area'].html(table);
                _this.cache[tableDesc.name] = table;
            })
            .catch(function (message) {
                triggerError(message);
            });
        }

    };

    /**
    * Добавляет возможность выбора таблицы
    * @param  {String} storage
    */
    this.renderStorageInList = function (storage, isSelected) {

        if (
            !this.cache['#select-storage-container'].find('option[value='+storage+']').length &&
            storage !== this.state.stcname
        ) {
            this.cache['#select-storage-container'].append('<option '+(isSelected ? 'selected=""' : '')+' value="'+storage+'">'+storage+'</option>');
        }

    };

    /**
    * Добавляет строку полей описания таблицы
    */
    this.renderStorageModal = function () {

        this.cache['#row-tpl'].append(this.cache['row-tpl-string']);
    };

    /**
    * Отрисовывает html контент для модального окно добавления элемента таблицы
    */
    this.renderElementModal = function (elementId) {

        var i, html = '';

        if (typeof this.cache.get('element-modal-' + State.currentStorage + '-' + (elementId || 0)) !== 'string') {

            this.db.store(this.state.stcname).where('name').equal(this.state.currentStorage)
            .get().then(function (tableDesc) {

                if (elementId > 0) {

                    this.db.store(this.state.currentStorage).where('id')
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

                        this.cache.set('element-modal-' + State.currentStorage + '-' + elementId, html);
                        this.cache['#add-storage-element'].html(this.cache.get('element-modal-' + State.currentStorage + '-' + elementId));
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

                    this.cache.set('element-modal-' + State.currentStorage + '-0', html);
                    this.cache['#add-storage-element'].html(this.cache.get('element-modal-' + State.currentStorage + '-0'));
                }

            }).catch(function (message) {
                triggerError(message);
            });
        } else {
            this.cache['#add-storage-element'].html(this.cache.get('element-modal-' + State.currentStorage + '-' + elementId));
        }
    };

    /**
    * Вывод сообщения об ошибке
    * @param  {String} message
    * @return {undefined}
    */
    function triggerError (message) {

        alert(message);
        throw new Error(message);
    };

    /**
     * Определяет получение DOMNode {$}
     * @param  {String} selector
     * @return {undefined}
     */
    function defineCacheJqDomElements (selector) {
        this.cache.getter(selector, function () {

            var value = this.get(selector);

            if (typeof value !== "undefined") {
                return value;
            }

            value = $(selector);

            this.set(selector, value);

            return value;

        });
    }

    ['#data-area',
    '#select-storage-container',
    '#row-tpl'].forEach(function (selector) {

        defineCacheJqDomElements(selector);
    });

    this.cache.getter('row-tpl-string', function () {

        var value = this.get('row-tpl-string');

        if (typeof value !== "undefined") {
            return value;
        }

        value = this['#row-tpl'].html();

        this.set('row-tpl-string', value);

        return value;

    });

    this.cache.getter('#add-storage-element', function () {

        var value = this.get('#add-storage-element');

        if (typeof value !== "undefined") {
            return value;
        }

        value = $('#add-storage-element').find('.modal-body');

        this.set('#add-storage-element', value);

        return value;

    });
}
