import { registerDecorator, ValidationArguments, ValidationOptions, ValidatorConstraintInterface } from "class-validator";


export class CheckGte implements ValidatorConstraintInterface {
    validate(value: number, args: ValidationArguments) {

        return !(value < args.object[args.constraints[0]])
    }

    defaultMessage(args?: ValidationArguments): string {
        return `Cannot accept ${args?.property} to be less than ${args?.constraints[0]}`;
    }
}

export function IsGte(constraints: string[] = [], validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints,
            validator: CheckGte,
        });
    };
}