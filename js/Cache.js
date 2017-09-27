/**
* @version: 1.0
* @author: dimabresky https://bitbucket.org/dimabresky/, https://github.com/dimabresky
* @copyright: Copyright (c) 2017 dimabresky. Все права защищены.
* @license: MIT лицензия http://www.opensource.org/licenses/mit-license.php
*/
(function (root, factory) {

    'use strict';

    if (typeof define === 'function' && define.amd) {

        define([], function () {
            return (root.Cache = factory());
        });

    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.Cache = factory();
    }
})(this, function () {

    'use strict';

    var cache = {};

    function Cache (cacheTime) {

        this.setter = function (key, value) {
            cache[key] = value;
        }



        this.getter = function (key, getter) {

            Object.defineProperty(this.cache, key, {
                get: getter
            });
        };

        setTimeout(function () {
            this.cache = {}
        }, cacheTime || 24*60000);
    }

    return Cache;

});
