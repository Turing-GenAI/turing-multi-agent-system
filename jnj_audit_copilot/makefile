format:
	poetry run black app/common/ app/core/ app/facade/ app/utils 
	poetry run isort app/common/ app/core/ app/facade/ app/utils

lint:
	poetry run flake8 app/common/ app/core/ app/facade/ app/utils --config=pyproject.toml --max-line-length 125 --ignore E203,W503

check:
	poetry run black --check app/common/ app/core/ app/facade/ app/utils || echo "Some files need formatting with black!"
	poetry run isort --check-only app/common/ app/core/ app/facade/ app/utils
