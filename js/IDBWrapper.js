/**
* @version: 1.1
* @author: dimabresky https://bitbucket.org/dimabresky/, https://github.com/dimabresky
* @copyright: Copyright (c) 2017 dimabresky. All rights reserved.
* @license: Licensed under the MIT license. See http://www.opensource.org/licenses/mit-license.php
*/

// Follow the UMD template https://github.com/umdjs/umd/blob/master/templates/returnExportsGlobal.js
(function (root, factory) {

    'use strict';

    if (typeof define === 'function' && define.amd) {

        define([], function () {
            return (root.IDBWrapper = factory());
        });

    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.IDBWrapper = factory();
    }
})(this, function () {
    var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB,
        Promise = window.Promise;

    if (!indexedDB) {

        throw new Error('Your browser is not support indexedDB');
    }

    if (typeof window !== 'object' || typeof window.document !== 'object') {

        throw new Error("IDBWrapper requires a window with a document");
    }

    /**
    * Функция обертка для indexedDB с использованием Promise
    * @param       {String} DBNAME          Имя базы данных
    * @param       {Number} DBVERSION       Версия базы данных
    * @param       {Function} onUpgradeNeeded callback для создания/изменения версии БД
    * @constructor
    */
    IDBWrapper = function (DBNAME, DBVERSION, onUpgradeNeeded) {

        'use strict';

        if (!DBNAME) {

            throw new Error("Missing database name");
        }

        this.db = null;

        this.transaction = null;

        this.DBNAME = DBNAME;

        this.DBVERSION = DBVERSION;

        this.onUpgradeNeeded = onUpgradeNeeded;

        /**
        * Закрывает текущее соединение с БД
        * @return {Promise}
        */
        this.close = function () {

            this.db.close();
            this.db = null;
        };

        /**
        * Подключение к БД
        * @return {Promise}
        */
        this.connect = function () {

            var that = this,

                promise = new Promise(

                    function (resolve, reject) {

                        var request = that.DBVERSION ? indexedDB.open(that.DBNAME, that.DBVERSION) : indexedDB.open(that.DBNAME);

                        request.onerror = function (event) {

                            return reject(event.target.error.message);
                        };

                        request.onblocked = function () {

                            return reject('Please close all other tabs that use this application');
                        };

                        request.onsuccess = function (event) {

                            that.db = event.target.result;
                            return resolve();
                        };

                        request.onupgradeneeded = function (event) {

                            that.db = event.target.result;

                            if (typeof that.onUpgradeNeeded === 'function') {

                                that.onUpgradeNeeded();
                            }
                        };
                    }
                );

            return promise;
        };

        /**
         * Переподключение к БД
         * @param  {Function} onUpgradeNeeded функция обратного вызова при смене версии
         * @return {Promise}
         */
        this.reconnect = function (onUpgradeNeeded) {

            this.DBVERSION = this.db.version + 1;

            this.onUpgradeNeeded = onUpgradeNeeded;

            if (this.transaction) {

                this.transaction.abort();
            }

            this.close();

            return this.connect();
        };

        /**
        * Создает хранилище БД
        * @param  {Object} storeData Объект данных для создания хранилища
        *
        * storeData = {
        *   name: 'Название хранилища',
        *   fields: [
        *       {
        *           code: 'Код поля',
        *           uniq: true/false
        *       },
        *       ...
        *   ]
        * }
        *
        * @return {this}
        */
        this.createStore = function (storeData) {

            if (!storeData.name) {

                throw new Error('The name of the store is not specified to create it');
            }

            if (!this.db.objectStoreNames.contains(storeData.name)) {

                var objectStore = this.db.createObjectStore(storeData.name, {keyPath: 'id', autoIncrement: true}),
                    i;

                if (Array.isArray(storeData.fields)) {

                    storeData.fields.unshift({code: 'id', uniq: true});

                    for (i = 0; i < storeData.fields.length; i = i + 1) {

                        if (typeof storeData.fields[i].code === 'string') {

                            objectStore.createIndex(storeData.fields[i].code, storeData.fields[i].code, { unique: typeof storeData.fields[i].uniq !== 'boolean' ? storeData.fields[i].uniq : false });
                        }
                    }
                }
            }

            return this;
        };

        /**
         * Удаление хранилища
         * @param  {String} name Имя хранилища
         * @return {this}
         */
        this.deleteStore = function (name) {

            if (typeof name === 'string') {

                this.db.deleteObjectStore(name);
            }

            return this;
        };

        /**
        * Список хранилищ
        * @return {Array}
        */
        this.getStoresList = function () {

            var list = [], i;

            for (i = 0; i < this.db.objectStoreNames.length; i = i + 1) {

                list.push(this.db.objectStoreNames[i]);
            }
            return list;
        };

        /**
        * Подключение к хранилищу и получение объекта для выполнения CRUD операций
        * @param  {String} name Имя хранилища
        * @return {Object}
        */
        this.store = function (name) {

            var store = null;

            if (!name) {

                throw new Error('The name of the repository is not specified when you try to connect to the repository');
            }

            if (typeof this.transaction !== 'IDBTransaction') {

                this.transaction = this.db.transaction(this.db.objectStoreNames, 'readwrite');
            }

            store = this.transaction.objectStore(name);

            return {

                /**
                 * Добавление записи в хранилище
                 * @param  {Object} data Объект данных для записи
                 * @return {Promise}
                 */
                add: function (data) {

                    return new Promise(

                        function (resolve, reject) {

                            var request = store.add(data);

                            request.onsuccess = function () {

                                return resolve();
                            };

                            request.onerror = function (event) {

                                return reject(event.target.error.message);
                            };
                        }
                    );
                },

                /**
                 * Получение записей хранилища
                 * @return {Promise}
                 */
                get: function () {

                    return new Promise(

                        function (resolve, reject) {

                            var request;

                            request = store.getAll();

                            request.onsuccess = function (event) {

                                return resolve(event.target.result || []);
                            };

                            request.onerror = function (event) {

                                return reject(event.target.error.message);
                            };
                        }
                    );
                },

                /**
                 * Устанавливает индекс поиска
                 * @param  {String} index
                 * @return {Object}
                 */
                where: function (index) {

                    var keyRange = null, deforder = 'nextunique', objIndex = store.index(index);

                    return {

                        /**
                         * @param  {String} value
                         * @return {this}
                         */
                        equal: function (value) {

                            keyRange = window.IDBKeyRange.only(value);

                            return this;
                        },

                        /**
                         * @param  {String} value
                         * @return {this}
                         */
                        more: function (value) {

                            keyRange = window.IDBKeyRange.lowerBound(value, true);

                            return this;
                        },

                        /**
                         * @param  {String} value
                         * @return {this}
                         */
                        less: function (value) {

                            keyRange = window.IDBKeyRange.upperBound(value, true);

                            return this;
                        },

                        /**
                         * @param  {String} value
                         * @return {this}
                         */
                        moreOrEqual: function (value) {

                            keyRange = window.IDBKeyRange.lowerBound(value);

                            return this;
                        },

                        /**
                         * @param  {String} value
                         * @return {this}
                         */
                        lessOrEqual: function (value) {

                            keyRange = window.IDBKeyRange.upperBound(value);

                            return this;
                        },

                        /**
                         * @param  {String} order
                         * @return {this}
                         */
                        order: function (order) {

                            deforder = order === 'desc' ? 'prevunique' : 'nextunique';

                            return this;

                        },

                        /**
                         * Выборка из хранилища
                         * @return {Promise}
                         */
                        get: function () {

                            return new Promise(

                                function (resolve, reject) {

                                    var data = [], value = null,

                                        cursorResult = objIndex.openCursor(keyRange, deforder);

                                    cursorResult.onsuccess = function (event) {

                                        var cursor = event.target.result;
                                        if (cursor) {

                                            value = cursor.value;

                                            value.id = cursor.primaryKey;

                                            data.push(value);

                                            cursor.advance(1);
                                        }

                                        return resolve(data);
                                    };

                                    cursorResult.onerror = function (event) {

                                        return reject(event.target.error.message);
                                    };
                                }
                            );
                        }
                    };
                },

                /**
                 * Обновление записей в хранилище
                 * @param  {Number} id ID записи
                 * @param  {Object} data Объект данных
                 * @return {Promise}
                 */
                update: function (id, data) {

                    return new Promise(

                        function (resolve, reject) {

                            if (!id) {

                                reject('You must specify an id to update the record');
                            }

                            if (typeof data !== 'object') {

                                reject('Data for updating is not an object');
                            }

                            data.id = id;

                            var request = store.put(data);

                            request.onsuccess = function (event) {

                                return resolve(event);
                            };

                            request.onerror = function (event) {

                                return reject(event.target.error.message);
                            };
                        }
                    );
                },

                /**
                 * Удаление записи из хранилища
                 * @param  {Number} id ID записи
                 * @return {Promise}
                 */
                delete: function (id) {

                    return new Promise(

                        function (resolve, reject) {

                            if (!id) {

                                reject('You must specify an id to delete the record');
                            }

                            var request = store.delete(id);

                            request.onsuccess = function () {

                                return resolve();
                            };

                            request.onerror = function (event) {

                                return reject(event.target.error.message);
                            };
                        }
                    );
                }
            };
        };
    };

    /**
     * Удаление базы данных
     * @param  {String} name Имя базы данных
     * @return {Promise}
     */
    IDBWrapper.prototype.deleteDatabase = function (name) {

        'use strict';

        var that = this;

        return new Promise(

            function (resolve, reject) {

                if (!name) {

                    reject('Missing database name');
                }

                if (that.db) {

                    that.close();
                }

                var request = window.indexedDB.deleteDatabase(name);

                request.onsuccess = function () {

                    return resolve();
                };

                request.onblocked = function (event) {

                    return reject('Delete database error');
                    console.error(event);
                };

                request.onerror = function (event) {

                    return reject(event.target.error.message);
                };

            }
        );
    };

    return IDBWrapper;

});
