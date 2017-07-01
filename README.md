# mobx-store-devtools

Connector between [Redux DevTools Extension](https://github.com/zalmoxisus/redux-devtools-extension) and [mobx-collection-store](https://github.com/infinum/mobx-collection-store)/[mobx-jsonapi-store](https://github.com/infinum/mobx-jsonapi-store)

## Installation

```bash
npm install --save-dev mobx-store-devtools
```

## Setup

```javascript
import {init} from 'mobx-store-devtools';
import {Collection} from 'mobx-collection-store';

const collection = new Collection();
init(collection); // This can be any instance of the collection or jsonapi store
```

## Store usage

For the store usage, check the [mobx-collection-store](https://github.com/infinum/mobx-collection-store/wiki) and [mobx-jsonapi-store](https://github.com/infinum/mobx-jsonapi-store/wiki) docs.

## License

The [MIT License](LICENSE)

## Credits

mobx-store-devtools library is maintained and sponsored by
[Infinum](http://www.infinum.co).

<img src="https://infinum.co/infinum.png" width="264">