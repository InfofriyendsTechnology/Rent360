import fs from 'fs';
import path from 'path';

const models = [
  'Store', 'Role', 'User', 'Category', 'Product', 'ProductItem', 
  'Customer', 'Booking', 'Offer', 'BookingItem', 'PaymentMode',
  'StoreBankAccount', 'TransactionCategory', 'Transaction', 
  'VendorType', 'Vendor', 'ServiceType', 'ItemServiceLog', 
  'TimeSlot', 'Accessory', 'Attendance', 'Holiday', 
  'StaffLeave', 'StaffSalary', 'StaffAdvance', 'Reminder', 
  'CreditVoucher', 'AuditLog', 'PurchaseInvoice', 'PurchaseItem', 
  'RetailSale', 'RetailSaleItem', 'SubscriptionPlan', 'StoreSubscription'
];

const srcDir = path.join(__dirname, '../src');
const getCamelCase = (str: string) => str.charAt(0).toLowerCase() + str.slice(1);

models.forEach(model => {
  const camelModel = getCamelCase(model);
  
  // 1. Validations
  const valPath = path.join(srcDir, 'validations', `${camelModel}.validation.ts`);
  if (!fs.existsSync(valPath)) {
    fs.writeFileSync(valPath, `import Joi from 'joi';\n\nexport const create${model}Schema = Joi.object({});\nexport const update${model}Schema = Joi.object({});\n`);
  }

  // 2. Folder-based Controllers
  const ctrlDir = path.join(srcDir, 'controllers', `${camelModel}Controller`);
  if (!fs.existsSync(ctrlDir)) fs.mkdirSync(ctrlDir, { recursive: true });

  const getImports = () => `import { Request, Response } from 'express';\nimport prisma from '../../utils/prisma';\nimport responseHandler from '../../utils/responseHandler';\n\n`;

  // getAll.ts
  if (!fs.existsSync(path.join(ctrlDir, `getAll${model}s.ts`))) {
    fs.writeFileSync(path.join(ctrlDir, `getAll${model}s.ts`), `${getImports()}export const getAll${model}s = async (req: Request, res: Response) => {\n  try {\n    const data = await (prisma as any).${camelModel}.findMany();\n    return responseHandler.success(res, 'Fetched successfully', data);\n  } catch (error) {\n    return responseHandler.internalServerError(res, error);\n  }\n};\n`);
  }

  // create.ts
  if (!fs.existsSync(path.join(ctrlDir, `create${model}.ts`))) {
    fs.writeFileSync(path.join(ctrlDir, `create${model}.ts`), `${getImports()}export const create${model} = async (req: Request, res: Response) => {\n  try {\n    const data = await (prisma as any).${camelModel}.create({ data: req.body });\n    return responseHandler.created(res, 'Created successfully', data);\n  } catch (error) {\n    return responseHandler.internalServerError(res, error);\n  }\n};\n`);
  }

  // getById.ts
  if (!fs.existsSync(path.join(ctrlDir, `get${model}ById.ts`))) {
    fs.writeFileSync(path.join(ctrlDir, `get${model}ById.ts`), `${getImports()}export const get${model}ById = async (req: Request, res: Response) => {\n  try {\n    const data = await (prisma as any).${camelModel}.findUnique({ where: { id: req.params.id } });\n    if (!data) return responseHandler.notFound(res);\n    return responseHandler.success(res, 'Fetched successfully', data);\n  } catch (error) {\n    return responseHandler.internalServerError(res, error);\n  }\n};\n`);
  }

  // update.ts
  if (!fs.existsSync(path.join(ctrlDir, `update${model}.ts`))) {
    fs.writeFileSync(path.join(ctrlDir, `update${model}.ts`), `${getImports()}export const update${model} = async (req: Request, res: Response) => {\n  try {\n    const data = await (prisma as any).${camelModel}.update({ where: { id: req.params.id }, data: req.body });\n    return responseHandler.success(res, 'Updated successfully', data);\n  } catch (error) {\n    return responseHandler.internalServerError(res, error);\n  }\n};\n`);
  }

  // delete.ts
  if (!fs.existsSync(path.join(ctrlDir, `delete${model}.ts`))) {
    fs.writeFileSync(path.join(ctrlDir, `delete${model}.ts`), `${getImports()}export const delete${model} = async (req: Request, res: Response) => {\n  try {\n    await (prisma as any).${camelModel}.delete({ where: { id: req.params.id } });\n    return responseHandler.success(res, 'Deleted successfully');\n  } catch (error) {\n    return responseHandler.internalServerError(res, error);\n  }\n};\n`);
  }

  // index.ts (Exports all)
  if (!fs.existsSync(path.join(ctrlDir, `index.ts`))) {
    fs.writeFileSync(path.join(ctrlDir, `index.ts`), `export * from './getAll${model}s';\nexport * from './create${model}';\nexport * from './get${model}ById';\nexport * from './update${model}';\nexport * from './delete${model}';\n`);
  }

  // 3. Routes (Update imports from folder)
  const routePath = path.join(srcDir, 'routes', `${camelModel}Routes.ts`);
  fs.writeFileSync(routePath, `import { Router } from 'express';\nimport { getAll${model}s, create${model}, get${model}ById, update${model}, delete${model} } from '../controllers/${camelModel}Controller';\nimport { authenticate } from '../middleware/auth';\nimport validator from '../utils/validators';\nimport { create${model}Schema, update${model}Schema } from '../validations/${camelModel}.validation';\n\nconst router = Router();\nrouter.use(authenticate);\nrouter.get('/', getAll${model}s);\nrouter.post('/', validator({ body: create${model}Schema }), create${model});\nrouter.get('/:id', get${model}ById);\nrouter.put('/:id', validator({ body: update${model}Schema }), update${model});\nrouter.delete('/:id', delete${model});\nexport default router;\n`);
});

console.log('Successfully generated Folder-based CRUD!');
