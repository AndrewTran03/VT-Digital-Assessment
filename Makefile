# For ease of convenience when trying to push & synchronize between all Git instances...

all: git_push

git_push:
	git push origin main && git push gh main && git push code main
