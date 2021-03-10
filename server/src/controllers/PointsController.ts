import knex from '../database/connection';
import { Request, Response } from 'express';

class PointsController {
    async create(request: Request, response: Response) {
        const {
            name,
            email,
            whatsapp,
            latitude,
            longitude,
            number,
            city,
            uf,
            items
        } = request.body;

        const trx = await knex.transaction();

        const insertedIds = await trx('points').insert({
            name,
            email,
            whatsapp,
            latitude,
            longitude,
            number,
            city,
            uf,
            image: 'image-fake'
        });

        const point_id = insertedIds[0];

        const pointItems = items.map((item_id: number) => {
            return {
                item_id,
                point_id
            }
        })

        await trx('point_items').insert(pointItems);

        return response.status(200).json({ success: true });
    }
}

export default PointsController;
