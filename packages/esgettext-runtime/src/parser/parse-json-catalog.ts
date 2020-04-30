import Ajv from 'ajv';
import { Catalog } from '../core/catalog';
import * as catalogSchema from '../core/catalog-schema.json';

export function validateJsonCatalog(data: Catalog): Catalog {
	const ajv = new Ajv();

	if (!ajv.validate(catalogSchema, data)) {
		//console.log(ajv.errorsText());
		throw new Error(ajv.errorsText());
	}

	return data;
}

export function parseJsonCatalog(json: string): Catalog {
	const data = JSON.parse(json);

	return validateJsonCatalog(data);
}
