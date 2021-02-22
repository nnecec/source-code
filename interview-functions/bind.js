const obj = {
  name: '123',
  sayName () {
    console.log(this.name)
  }
}

const say = obj.sayName.bind(null)

say()
