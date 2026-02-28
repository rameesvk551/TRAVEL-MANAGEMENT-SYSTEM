'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize: any, DataTypes: any) => {
    class user extends Model {
        static associate(models: any) {
        }
    }

    user.init(
        {
            name: DataTypes.STRING,
            imageUrl: DataTypes.STRING,
            phone: DataTypes.STRING,
            email: DataTypes.STRING,
            password: DataTypes.STRING,
            userRole: DataTypes.STRING,
            loggedIn: DataTypes.BOOLEAN,
            status: DataTypes.BOOLEAN,
            isDeleted: DataTypes.BOOLEAN,
            allowLogin: DataTypes.BOOLEAN,
        },
        {
            sequelize,
            modelName: 'user',
        }
    );

    return user;
};
