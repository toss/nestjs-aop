export const AddMetadata = <K extends string | symbol = string, V = any>(
  metadataKey: K,
  metadataValue: V,
): MethodDecorator => {
  const decoratorFactory = (
    _: any,
    __: string | symbol,
    descriptor: PropertyDescriptor,
  ): TypedPropertyDescriptor<any> => {
    if (!Reflect.hasMetadata(metadataKey, descriptor.value)) {
      Reflect.defineMetadata(metadataKey, [], descriptor.value);
    }
    const metadataValues: V[] = Reflect.getMetadata(metadataKey, descriptor.value);
    metadataValues.push(metadataValue);
    return descriptor;
  };
  decoratorFactory.KEY = metadataKey;
  return decoratorFactory;
};
