
window.DBConfig = {

    /**
     * Код базы данных
     * @type {String}
     */
    DBNAME: 'IDBMA',

    /**
     * Массив хранилищ, которые будут созданы по-умолчанию
     * при первом подключении к указанной БД
     * Поле id для хранилиц указывать не нужно, так как оно будет создано
     * автоматически при создании хранилища и будет autoincrement
     * @type {Array}
     */
    stores: [
        {
            name: 'users',
            fields: [
                {
                    name: 'Имя',
                    code: 'name',
                    type: 'String'
                },
                {
                    name: 'Фамилия',
                    code: 'last_name',
                    type: 'String'
                },
                {
                    name: 'Email',
                    code: 'email',
                    type: 'String'
                },
                {
                    name: 'Активность',
                    code: 'active',
                    type: 'YesNo'
                }
            ]
        },
        {
            name: 'articles',
            fields: [
                {
                    name: 'Название',
                    code: 'name',
                    type: 'String'
                },
                {
                    name: 'Описание',
                    code: 'description',
                    type: 'Text'
                },
                {
                    name: 'Активность',
                    code: 'active',
                    type: 'YesNo'
                }
            ]
        }
    ]
};
