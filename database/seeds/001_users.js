import bcrypt from 'bcrypt';
import UserModel from '../../app/Models/UserModel.js';

export default {

    up: async () => {

        const senha = "123456";        await UserModel.bulkCreate([
            { nome: 'Admin', email: 'admin@admin.com', senha: await bcrypt.hash(senha, 10) },
        ])
    },

    down: async () => {        await UserModel.destroy({
            where: {
                email: ['admin@admin.com']
            }
        });
    }
};
