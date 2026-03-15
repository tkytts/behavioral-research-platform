import { getConfederates, getScript } from '../api/confederates';


export async function getConfederatesStart() {
  const data = await getConfederates();
  return { femaleData: data.female, maleData: data.male };
}

export async function getScriptForOrder(order) {
  return getScript(order);
}
