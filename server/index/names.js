import{getUserName} from '../database/usersDB.js'

const route = express.Router();

//getUser name
route.get('/:id',async (req, res) => {
    const { id } = req.params;
    try {
        const user = await getUserName(id);
        if (!user) {
            return res.sendStatus(404);
        }
        res.send(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});