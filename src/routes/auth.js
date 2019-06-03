import Router from 'koa-router';
import DeleteAction from '../actions/auth/delete';
import RegistrationEmailAction from '../actions/auth/registration-email';
import ValidateHashAction from '../actions/auth/validate-hash';
import AuthMiddleware from '../middlewares/auth';

const router = new Router({
  prefix: '/auth',
});

/**
 * @api {POST} /auth/profile/delete/validate-hash Validate hash
 * @apiName PostAuthProfileDeleteValidateHash
 * @apiGroup Auth
 *
 * @apiParam {String} hash Hash for validation
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 204 NO CONTENT
 *
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 409 CONFLICT
 *     {
 *       "message": "Error while processing"
 *     }
 *
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 422 Unprocessable Entity
 *     {
 *       "message": "Hash not exists"
 *     }
 */
router.post('/profile/delete/validate-hash', ValidateHashAction);

/**
 * @api {POST} /auth/profile/delete Try to remove account
 * @apiName PostAuthProfileDelete
 * @apiGroup Auth
 *
 * @apiParam {Boolean} [send] Send email with link?
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 204 NO CONTENT
 *
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 409 CONFLICT
 *     {
 *       "message": "User has recommendations in progress"
 *     }
 */
router.post('/profile/delete', AuthMiddleware, DeleteAction);

/**
 * @api {POST} /auth/profile/registration_email Send email notify after registration
 * @apiName PostAuthProfileRegistrationEmail
 * @apiGroup Auth
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 204 NO CONTENT
 */
router.post('/profile/registration_email', RegistrationEmailAction);

export function routes() {
  return router.routes();
}
