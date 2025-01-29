import { Request, Response, Router } from 'express';
import { ZZZ } from '../utils/route-handlers';

const router = Router();

router.get('/hsr/:uid/:character/image', async (req: Request, res: Response) => {
	return await ZZZ(req, res, true);
});

export default router;
