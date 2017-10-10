
function App (Cache, IDBWrapper, PageNavigator, $) {

    var _this = this;

    /**
    * Вывод сообщения об ошибке
    * @param  {String} message
    * @return {undefined}
    */
    function _triggerError (message) {

        alert(message);
        throw new Error(message);
    };

    /**
     * Определяет геттер получения DOMNode
     * @param  {String} selector
     * @return {undefined}
     */
    function _defineCacheJqDomElements (selector) {

        _this.cache.getter(selector, function () {

            var value = _this.cache.get(selector);

            if (typeof value !== "undefined") {
                return value;
            }

            value = $(selector);

            _this.cache.set(selector, value);

            return value;

        });
    }

    /**
     * Очистка кеша по текущей таблице
     * @param       {String} storageName
     * @return      {undefined}
     */
    function _clearCacheForStorage (storageName) {
        _this.cache.remove(storageName + '_table_html');
        _this.cache.remove(storageName + '_page_navigator');
    }

    /**
     * Общие действия по текущей таблице
     * очистка кеша, сброс текущей страницы, перерендер
     * @return      {undefined}
     */
    function _commonCStorageActions () {
        _clearCacheForStorage(_this.state.currentStorage);
        _this.state.page = 1;
        _this.renderStorageTable(_this.cache.get(_this.state.currentStorage + "_table_desc"));
    }

    /**
     * Рендерит таблицу данных
     * @param       {Object} tableDesc
     * @param       {PageNavigator} pageNavigator
     * @return      {undefined}
     */
    function _renderTable (tableDesc, pageNavigator) {

        var tmp = {};
        var pager = pageNavigator.page(_this.state.page);
        var tableData = pager.getItems();
        var table = '<table class="table">\
        <thead>\
        <tr>\
        <td class="pr-0 text-right" colspan="'+(tableDesc.fields.length + 1)+'">\
        <button onclick="app.renderElementModal()" data-toggle="modal" data-target="#add-storage-element-modal" class="btn btn-success">\
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
                    table += '<td>'+tableData[i][tableDesc.fields[j].code]+'</td>';
                }
                table += '<td>\
                <button onclick="app.renderElementModal('+tableData[i].id+')" data-toggle="modal" data-target="#add-storage-element-modal" class="btn btn-primary">Редактировать</button>\
                <button onclick="app.deleteElement('+tableData[i].id+')" class="btn btn-danger">Удалить</button>\
                </td>\
                </tr>';
            }
        }

        table += '</tbody><tfoot><tr><td colspan="'+ tableDesc.fields.length + 1 +'" \
        align="right">'+pager.getHtml()+'</td></tr></tfoot></table>';

        _this.cache['#data-area'].html(table);

        if (typeof _this.cache.get(tableDesc.name + '_table_html') === 'object') {
            tmp = _this.cache.get(tableDesc.name + '_table_html');
            tmp[[_this.state.page]] = table;
            _this.cache.set(tableDesc.name + '_table_html', tmp);
        } else {
            tmp[[_this.state.page]] = table;
            _this.cache.set(tableDesc.name + '_table_html', tmp);
        }
    }

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
        currentStorage: null,

        /**
         * Текущая страница
         * @type {Number}
         */
        page: 1,

        /**
         * Количество элементов на страницу
         * @type {Number}
         */
        numberPerPage: 10
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
            name: _this.state.stcname,
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

        if (
            typeof _this.cache.get(tableDesc.name + '_table_html') === 'object' &&
            typeof _this.cache.get(tableDesc.name + '_table_html')[_this.state.page] === 'string'
        ) {
            // рендерим таблицу из кеша
            _this.cache['#data-area'].html(_this.cache.get(tableDesc.name + '_table_html')[_this.state.page]);
        } else {
            if (typeof _this.cache.get(tableDesc.name + '_page_navigator') === 'PageNavigator') {
                _renderTable(tableDesc, _this.cache.get(tableDesc.name + '_page_navigator'));
            } else {
                // получаем данные текущей таблицы
                _this.db.store(tableDesc.name).where('id').order('desc').get()
                .then(function (tableData) {
                    _this.cache.set(
                        tableDesc.name + '_page_navigator',
                        new PageNavigator(tableData, _this.state.numberPerPage, '<a href="#" onclick="app.renderStoragePage(#page#)">#content#</a>')
                    );
                    _renderTable(tableDesc, _this.cache.get(tableDesc.name + '_page_navigator'));
                })
                .catch(function (message) {
                    _triggerError(message);
                });
            }
        }

    };

    /**
     * Рендер страницы текущей таблицы
     * @param  {Number} page
     * @return {Boolean}
     */
    this.renderStoragePage = function (page) {
        _this.state.page = page > 0 ? page : 1;
        _this.renderStorageTable(_this.cache.get(_this.state.currentStorage + '_table_desc'));
        return false;
    }

    /**
     * Добавляет возможность выбора таблицы
     * @param  {String}  storage
     * @param  {Boolean} isSelected
     * @return {undefined}
     */
    this.renderStorageInList = function (storageName, isSelected) {

        if (!this.cache['#select-storage-container'].find('option[value='+storageName+']').length) {
            this.cache['#select-storage-container'].append('<option '+(isSelected ? 'selected=""' : '')+' value="'+storageName+'">'+storageName+'</option>');
        }

    };

    /**
     * Удаляет возможномть выбора таблицы
     * @param  {String} storageName
     * @return {undefined}
     */
    this.removeStorageFromList = function (storageName) {
        this.cache['#select-storage-container'].find('option[value='+storageName+']').remove();
    }

    /**
    * Добавляет строку полей описания таблицы
    */
    this.renderStorageModal = function () {

        this.cache['#row-tpl'].append(this.cache['row-tpl-string']);
    };

    /**
     * Отрисовывает html контент для модального окна добавления элемента таблицы
     * @param  {Number} elementId
     * @return {undefined}
     */
    this.renderElementModal = function (elementId) {

        var i, html = '';

        if (typeof this.cache.get('element-modal-' + this.state.currentStorage + '-' + (elementId || 0)) !== 'string') {

            this.db.store(this.state.stcname).where('name').equal(this.state.currentStorage)
            .get().then(function (tableDesc) {

                if (elementId > 0) {

                    _this.db.store(_this.state.currentStorage).where('id')
                    .equal(elementId).get().then(function (arrdata) {
                        var data = arrdata[0];
                        for (i = 0; i < tableDesc[0].fields.length; i = i + 1) {

                            if (tableDesc[0].fields[i].code === 'id') {
                                html += '<input name="id" type="hidden" value="'+data[tableDesc[0].fields[i].code]+'">';
                            }

                            if (tableDesc[0].fields[i].type === 'String') {
                                html += '<div class="form-group">';
                                html += '<label>'+(tableDesc[0].fields[i].title || tableDesc[0].fields[i].code)+'</label>';
                                html += '<input class="form-control" name="'+tableDesc[0].fields[i].code+'" value="'+data[tableDesc[0].fields[i].code]+'" type="text">';
                                html += '</div>';
                            } else if (tableDesc[0].fields[i].type === 'Boolean') {
                                html += '<div class="checkbox">';
                                html += '<label>';
                                html += '<input '+(data[tableDesc[0].fields[i].code] === 'Yes' ? 'checked=""' : '')+' name="'+tableDesc[0].fields[i].code+'" type="checkbox"> <b>' + tableDesc[0].fields[i].title + '</b>'
                                html += '</label>';
                                html += '</div>';
                            } else if (tableDesc[0].fields[i].type === 'Text') {
                                html += '<div class="form-group">';
                                html += '<label>'+(tableDesc[0].fields[i].title || tableDesc[0].fields[i].code)+'</label>';
                                html += '<textarea class="form-control" cols="15" rows="10" name="'+tableDesc[0].fields[i].code+'" >'+data[tableDesc[0].fields[i].code]+'</textarea>';
                                html += '</div>';
                            }
                        }

                        _this.cache.set('element-modal-' + _this.state.currentStorage + '-' + elementId, html);
                        _this.cache['#add-storage-element'].html(_this.cache.get('element-modal-' + _this.state.currentStorage + '-' + elementId));
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
                            html += '<input value="Y" name="'+tableDesc[0].fields[i].code+'" type="checkbox"> <b>' + tableDesc[0].fields[i].title + '</b>'
                            html += '</label>';
                            html += '</div>';
                        } else if (tableDesc[0].fields[i].type === 'Text') {
                            html += '<div class="form-group">';
                            html += '<label>'+(tableDesc[0].fields[i].title || tableDesc[0].fields[i].code)+'</label>';
                            html += '<textarea class="form-control" cols="15" rows="10" name="'+tableDesc[0].fields[i].code+'" ></textarea>';
                            html += '</div>';
                        }

                    }

                    _this.cache.set('element-modal-' + _this.state.currentStorage + '-0', html);
                    _this.cache['#add-storage-element'].html(_this.cache.get('element-modal-' + _this.state.currentStorage + '-0'));
                }

            }).catch(function (message) {
                _triggerError(message);
            });
        } else {

            this.cache['#add-storage-element'].html(this.cache.get('element-modal-' + this.state.currentStorage + '-' + (elementId || 0)));
        }
    };

    /**
     * Добавление таблицы а БД
     * @return {undefined}
     */
    this.addStorage = function () {

        var storageName = null;
        var tr = null;
        var i, j;
        var fields = [];
        var errors = [];
        var tmpVal = null;

        storageName = this.cache['#storage-name'].val().toString().toLowerCase(),
        tr = this.cache['#row-tpl'].find('tr');

        if ( !/^[a-z]+$/.test(storageName) ) {
            _triggerError('Название таблицы должно состоять из латинских букв и знаков _ вместо пробелов. Пожалуйста, проверте правильность введенного названия таблицы');
        }

        if (this.db.getStoresList().indexOf(storageName) !== -1) {
            _triggerError('Таблица с таким именем уже существует');
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
                if (!/^[а-яА-Яa-zA-Z_'\s]+$/.test(tmpVal)) {
                    _triggerError('Название поля должено состоять только из букв пробелов');
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

            this.db.createNewStore({
                name: storageName,
                fields: fields
            })
            .then(function () {

                return _this.db.store(_this.state.stcname).add({
                    name: storageName,
                    fields: fields
                });
            })
            .then(function () {

                _this.cache['#row-tpl'].html('');
                _this.renderStorageModal();
                _this.cache['#add-storage'].modal('hide');
                _this.cache['#storage-name'].val('');
                _this.renderStorageInList(storageName, true);
                _this.cache['#select-storage-container'].val(storageName);
                _this.cache['#select-storage-container'].trigger('change');
            })
            .catch(function (message) {

                _triggerError(message);
            });

        } else {
            _triggerError('Правильно заполненых полей для создания таблицы не найдено');
        }

    };

    /**
     * Обработка выбора таблицы данных
     * @param  {DOMNode} node
     * @return {undefined}
     */
    this.choiceOfStorage = function (node) {

        this.state.currentStorage = node.value;

        this.state.page = 1;

        this.cache['#data-area'].html('');

        this.cache['#delete-storage-btn'].addClass('hidden');

        if (this.state.currentStorage) {

            this.cache['#delete-storage-btn'].removeClass('hidden');

            if (this.cache.get(this.state.currentStorage + "_table_desc") === 'oblect') {
                this.renderStorageTable(this.cache.get(this.state.currentStorage + "_table_desc"));
            } else {
                // получаем описание текущей таблицы
                this.db.store(this.state.stcname)
                .where("name")
                .equal(this.state.currentStorage)
                .get()
                .then(function (tableDesc) {
                    _this.renderStorageTable(tableDesc[0]);
                    _this.cache.set(_this.state.currentStorage + "_table_desc", tableDesc[0]);
                })
                .catch(function (message) {
                    _triggerError(message);
                });
            }
        }
    };

    /**
     * Добавление/редактирование нового элемента в таблицу
     * @return {undefined}
     */
    this.addEditElement = function () {

        var tableDesc = this.cache.get(this.state.currentStorage + '_table_desc');

        var fieldsDesc = tableDesc.fields;

        var elementId = null, method = null, args = [];

        var toSave = {};

        fieldsDesc.forEach(function (fieldDesc) {

            var $field = null;

            if (fieldDesc.code !== 'id') {

                toSave[fieldDesc.code] = null;

                switch (fieldDesc.type) {

                    case 'String':
                        $field = _this.cache['#add-storage-element'].find('input[name='+fieldDesc.code+']');
                        toSave[fieldDesc.code] = $field.val();
                        break;

                    case 'Boolean':
                        $field = _this.cache['#add-storage-element'].find('input[name='+fieldDesc.code+']');
                        toSave[fieldDesc.code] = $field.is(':checked') ? 'Yes' : 'No';
                        break;

                    case 'Text':
                        $field = _this.cache['#add-storage-element'].find('textarea[name='+fieldDesc.code+']');
                        toSave[fieldDesc.code] = $field.val();
                        break;

                }

            } else {
                elementId = _this.cache['#add-storage-element'].find('input[name='+fieldDesc.code+']').val();
            }
        });

        if (elementId > 0) {
            method = "update";
            args = [elementId, toSave];
        } else {
            method = "add";
            args = [toSave];
        }

        this.db.store(this.state.currentStorage)[method].apply(null, args)
        .then(function () {
            _commonCStorageActions();
            _this.cache['#add-storage-element-modal'].modal('hide');
            _this.cache['#add-storage-element'].html('');
            if (elementId > 0) {
                _this.cache.remove('element-modal-' + _this.state.currentStorage + '-' + elementId);
            }
        })
        .catch(function (message) {
            _triggerError(message);
        });

    };

    /**
     * Удаление элемента
     * @param  {Number} elementId
     * @return {undefined}
     */
    this.deleteElement = function (elementId) {

        if (elementId > 0) {

            this.db.store(this.state.currentStorage)
            .delete(elementId)
            .then(function () {
                _commonCStorageActions();
                _this.cache.remove('element-modal-' + _this.state.currentStorage + '-' + elementId);
            }).catch(function (message) {
                _triggerError(message);
            });

        }

    };

    /**
     * Удаление хранилища
     * @return {undefined}
     */
    this.deleteStorage = function () {
        _this.db.store(_this.state.stcname).where('name').equal(_this.state.currentStorage).get()
        .then(function (data) {
            console.log(data);
            return _this.db.store(_this.state.stcname).delete(data[0].id);
        })
        .then(function () {
            return _this.db.deleteStore(_this.state.currentStorage);
        })
        .then(function () {
            _this.removeStorageFromList(_this.state.currentStorage);
            _clearCacheForStorage(_this.state.currentStorage);
            _this.cache['#select-storage-container'].val('');
            _this.cache['#select-storage-container'].trigger('change');
        })
        .catch(function (message) {
            _triggerError(message);
        });
    };

    [
        '#data-area',
        '#delete-storage-btn',
        '#add-storage',
        '#storage-name',
        '#select-storage-container',
        '#add-storage-element-modal',
        '#add-storage-element',
        '#row-tpl'
    ]
    .forEach(function (selector) {

        _defineCacheJqDomElements(selector);
    });

    // определяем геттер для получения шаблона строки формы добавления таблицы
    this.cache.getter('row-tpl-string', function () {

        var value = _this.cache.get('row-tpl-string');

        if (typeof value !== "undefined") {
            return value;
        }

        value = _this.cache['#row-tpl'].html();

        _this.cache.set('row-tpl-string', value);

        return value;

    });

    // подключаемся к бд
    this.db.connect().then(function () {

        var dbStoragesList = _this.db.getStoresList(), i, storagesList;

        for (i = 0; i < dbStoragesList.length; i = i + 1) {

            if (dbStoragesList[i] !== _this.state.stcname) {
                // генерируем список таблиц
                _this.renderStorageInList(dbStoragesList[i]);
            }
        }

    }).catch(function (message) {
        _triggerError(message);
    });
}

window.app = new App(Cache, IDBWrapper, PageNavigator, jQuery);
