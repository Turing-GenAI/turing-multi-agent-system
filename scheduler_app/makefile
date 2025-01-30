format:
	poetry run black app/
	poetry run isort app/

lint:
	poetry run flake8 app/ --config=pyproject.toml --max-line-length 125 --ignore E203,W503

check:
	poetry run black --check app || echo "Some files need formatting with black!"
	poetry run isort --check-only app/
