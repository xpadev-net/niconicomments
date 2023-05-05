const nativeSort = <T>(getter: (input: T) => number) => {
  return (a: T, b: T) => {
    if (getter(a) > getter(b)) {
      return 1;
    } else if (getter(a) < getter(b)) {
      return -1;
    } else {
      return 0;
    }
  };
};

export { nativeSort };
