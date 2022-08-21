export class FocusUtil {
  public static arrayToUriList(value: string[]) {
    return value.reduce((previous, current, i, input) => {
      return previous + (input.length === i ? "" : "\r\n") + current;
    });
  }

  public static uriListToArray(value: string) {
    const regex = /\r/g;
    const tmp = value.replace(regex, "");
    return tmp.split("\n");
  }
}
