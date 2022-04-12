# $1: packageName
# $2: commandName
node scripts/make_new_command.js --packageName $1 --commandNameSnakeCase $2 --remove
node scripts/make_new_command_handler.js --packageName $1 --commandNameSnakeCase $2 --handlerNameSnakeCase $2 --remove