import "reflect-metadata";

const timeStampMetadataKey = Symbol("timeStamp");

// const timeStamp = (data?: number) => {
//     return Reflect.metadata(timeStampMetadataKey, data || new Date().getTime());
// }

const timeStamp = () => {
    return (target: {} | any, name?: PropertyKey): any => {
      const descriptor = {
        get(this: any) {
            return 11212;
        },
        enumerable: true,
        configurable: true,
      };
  
      Object.defineProperty(target, name, descriptor);
    };
}

export default timeStamp;