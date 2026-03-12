export const AddMetadata = <K extends string | symbol = string, V = any>(
  metadataKey: K,
  metadataValue: V,
): MethodDecorator => {
  const decoratorFactory = (
    _: any,
    __: string | symbol,
    descriptor: PropertyDescriptor,
  ): TypedPropertyDescriptor<any> => {
    const target = descriptor.value || descriptor.get || descriptor.set;
    if (!Reflect.hasMetadata(metadataKey, target)) {
      Reflect.defineMetadata(metadataKey, [], target);
    }
    const metadataValues: V[] = Reflect.getMetadata(metadataKey, target);
    metadataValues.push(metadataValue);
    return descriptor;
  };
  decoratorFactory.KEY = metadataKey;
  return decoratorFactory;
};
