import pandas as pd

# 1. Base de datos consolidada de tus páginas escaneadas
datos_tarjetas = [
    # --- SECCIÓN: NEW YORK YANKEES ---
    {"Equipo": "New York Yankees", "Jugador": "Don Mattingly", "Marca/Año": "Topps 1988", "Número": "100", "Categoría": "Estrella"},
    {"Equipo": "New York Yankees", "Jugador": "Don Mattingly", "Marca/Año": "Upper Deck 1990", "Número": "354", "Categoría": "Estrella"},
    {"Equipo": "New York Yankees", "Jugador": "Don Mattingly", "Marca/Año": "Topps 1990", "Número": "200", "Categoría": "Estrella"},
    {"Equipo": "New York Yankees", "Jugador": "Don Mattingly (Hit Man)", "Marca/Año": "Topps 1988", "Número": "2", "Categoría": "Inserto"},
    {"Equipo": "New York Yankees", "Jugador": "Steve Sax", "Marca/Año": "Upper Deck 1990", "Número": "25", "Categoría": "Base"},
    {"Equipo": "New York Yankees", "Jugador": "Steve Sax", "Marca/Año": "Upper Deck 1990", "Número": "25", "Categoría": "Base"},  # Duplicado
    {"Equipo": "New York Yankees", "Jugador": "Steve Sax", "Marca/Año": "Upper Deck 1990", "Número": "25", "Categoría": "Base"},  # Triplicado
    {"Equipo": "New York Yankees", "Jugador": "Steve Sax", "Marca/Año": "Upper Deck 1991", "Número": "112", "Categoría": "Base"},
    {"Equipo": "New York Yankees", "Jugador": "Steve Sax", "Marca/Año": "Topps 1991", "Número": "40", "Categoría": "Base"},
    {"Equipo": "New York Yankees", "Jugador": "Hensley Meulens", "Marca/Año": "Upper Deck 1991", "Número": "696", "Categoría": "Base"},
    {"Equipo": "New York Yankees", "Jugador": "Hensley Meulens", "Marca/Año": "Topps 1991", "Número": "675", "Categoría": "Base"},
    {"Equipo": "New York Yankees", "Jugador": "Hensley Meulens", "Marca/Año": "Topps 1990", "Número": "547", "Categoría": "Base"},
    {"Equipo": "New York Yankees", "Jugador": "Bobby Meacham", "Marca/Año": "Upper Deck 1989", "Número": "77", "Categoría": "Base"},
    {"Equipo": "New York Yankees", "Jugador": "Bobby Meacham", "Marca/Año": "Topps 1989", "Número": "659", "Categoría": "Base"},
    {"Equipo": "New York Yankees", "Jugador": "Kevin Maas", "Marca/Año": "Upper Deck 1991", "Número": "594", "Categoría": "Base"},
    {"Equipo": "New York Yankees", "Jugador": "Hal Morris", "Marca/Año": "Topps 1990", "Número": "236", "Categoría": "Base"},
    {"Equipo": "New York Yankees", "Jugador": "Matt Nokes", "Marca/Año": "Topps 1989", "Número": "336", "Categoría": "Base"},
    {"Equipo": "New York Yankees", "Jugador": "Matt Nokes", "Marca/Año": "Upper Deck 1991", "Número": "673", "Categoría": "Base"},
    {"Equipo": "New York Yankees", "Jugador": "Matt Nokes", "Marca/Año": "Upper Deck 1990", "Número": "744", "Categoría": "Base"},
    {"Equipo": "New York Yankees", "Jugador": "Matt Nokes", "Marca/Año": "Upper Deck 1991", "Número": "295", "Categoría": "Base"},
    {"Equipo": "New York Yankees", "Jugador": "Clay Parker", "Marca/Año": "Topps 1990", "Número": "511", "Categoría": "Base"},
    {"Equipo": "New York Yankees", "Jugador": "Pascual Pérez", "Marca/Año": "Upper Deck 1991", "Número": "769", "Categoría": "Base"},
    {"Equipo": "New York Yankees", "Jugador": "Pascual Pérez", "Marca/Año": "Upper Deck 1991", "Número": "671", "Categoría": "Base"},
    {"Equipo": "New York Yankees", "Jugador": "Dave Righetti (AL Leaders)", "Marca/Año": "Topps 1987", "Número": "616", "Categoría": "Inserto"},
    {"Equipo": "New York Yankees", "Jugador": "Jerry Royster", "Marca/Año": "Topps 1988", "Número": "257", "Categoría": "Base"},
    {"Equipo": "New York Yankees", "Jugador": "Jeff Robinson", "Marca/Año": "Topps 1990", "Número": "678", "Categoría": "Base"},
    {"Equipo": "New York Yankees", "Jugador": "Ken Phelps", "Marca/Año": "Upper Deck 1989", "Número": "167", "Categoría": "Base"},
    {"Equipo": "New York Yankees", "Jugador": "Rick Rhoden", "Marca/Año": "Topps 1988", "Número": "185", "Categoría": "Base"},
    {"Equipo": "New York Yankees", "Jugador": "Tim Stoddard", "Marca/Año": "Donruss 1987", "Número": "569", "Categoría": "Base"},
    {"Equipo": "New York Yankees", "Jugador": "Tim Stoddard", "Marca/Año": "Topps 1986", "Número": "469", "Categoría": "Base"},
    {"Equipo": "New York Yankees", "Jugador": "Lenn Sakata", "Marca/Año": "Topps 1986", "Número": "716", "Categoría": "Base"},
    {"Equipo": "New York Yankees", "Jugador": "Rafael Santana", "Marca/Año": "Score 1989", "Número": "296", "Categoría": "Base"},
    {"Equipo": "New York Yankees", "Jugador": "Scott Sanderson", "Marca/Año": "Upper Deck 1991", "Número": "415", "Categoría": "Base"},
    {"Equipo": "New York Yankees", "Jugador": "David West", "Marca/Año": "Upper Deck 1990", "Número": "158", "Categoría": "Base"},
    {"Equipo": "New York Yankees", "Jugador": "David West", "Marca/Año": "Upper Deck 1990", "Número": "158", "Categoría": "Base"},  # Duplicado
    {"Equipo": "New York Yankees", "Jugador": "Don Slaught", "Marca/Año": "Donruss 1989", "Número": "178", "Categoría": "Base"},
    {"Equipo": "New York Yankees", "Jugador": "Don Slaught", "Marca/Año": "Upper Deck 1991", "Número": "602", "Categoría": "Base"},
    {"Equipo": "New York Yankees", "Jugador": "Bob Tewksbury", "Marca/Año": "Topps 1987", "Número": "123", "Categoría": "Base"},
    {"Equipo": "New York Yankees", "Jugador": "Bob Tewksbury", "Marca/Año": "Topps 1987", "Número": "123", "Categoría": "Base"},  # Duplicado
    {"Equipo": "New York Yankees", "Jugador": "Steve Trout", "Marca/Año": "Topps 1988", "Número": "456", "Categoría": "Base"},
    {"Equipo": "New York Yankees", "Jugador": "Wayne Tolleson", "Marca/Año": "Topps 1988", "Número": "121", "Categoría": "Base"},
    {"Equipo": "New York Yankees", "Jugador": "Team Leaders / Stump Merrill", "Marca/Año": "Topps 1991", "Número": "429", "Categoría": "Base"},
    {"Equipo": "New York Yankees", "Jugador": "Yankees Checklist", "Marca/Año": "Upper Deck 1991", "Número": "98", "Categoría": "Base"},

    # --- SECCIÓN: CHICAGO CUBS ---
    {"Equipo": "Chicago Cubs", "Jugador": "Greg Maddux", "Marca/Año": "Topps 1988", "Número": "361", "Categoría": "HOF"},
    {"Equipo": "Chicago Cubs", "Jugador": "Greg Maddux", "Marca/Año": "Score 1989", "Número": "420", "Categoría": "HOF"},
    {"Equipo": "Chicago Cubs", "Jugador": "Greg Maddux", "Marca/Año": "Topps 1991", "Número": "50", "Categoría": "HOF"},
    {"Equipo": "Chicago Cubs", "Jugador": "Greg Maddux", "Marca/Año": "Upper Deck 1990", "Número": "52", "Categoría": "HOF"},
    {"Equipo": "Chicago Cubs", "Jugador": "Rafael Palmeiro", "Marca/Año": "Topps 1987", "Número": "634", "Categoría": "Rookie"},
    {"Equipo": "Chicago Cubs", "Jugador": "Rafael Palmeiro", "Marca/Año": "Topps 1988", "Número": "450", "Categoría": "Estrella"},
    {"Equipo": "Chicago Cubs", "Jugador": "Andre Dawson (All-Star)", "Marca/Año": "Topps 1988", "Número": "750", "Categoría": "HOF"},
    {"Equipo": "Chicago Cubs", "Jugador": "Andre Dawson", "Marca/Año": "Upper Deck 1990", "Número": "325", "Categoría": "HOF"},
    {"Equipo": "Chicago Cubs", "Jugador": "Andre Dawson", "Marca/Año": "Topps 1990", "Número": "300", "Categoría": "HOF"},
    {"Equipo": "Chicago Cubs", "Jugador": "Andre Dawson (MVP)", "Marca/Año": "Donruss 1989", "Número": "3", "Categoría": "HOF / Inserto"},
    {"Equipo": "Chicago Cubs", "Jugador": "Andre Dawson (All-Star Game)", "Marca/Año": "Upper Deck 1991", "Número": "353", "Categoría": "HOF"},
    {"Equipo": "Chicago Cubs", "Jugador": "Andre Dawson (Record Breaker)", "Marca/Año": "Topps 1988", "Número": "5", "Categoría": "HOF / Inserto"},
    {"Equipo": "Chicago Cubs", "Jugador": "Andre Dawson", "Marca/Año": "Upper Deck 1992", "Número": "361", "Categoría": "HOF"},
    {"Equipo": "Chicago Cubs", "Jugador": "Andre Dawson (All-Star)", "Marca/Año": "Topps 1989", "Número": "350", "Categoría": "HOF"},
    {"Equipo": "Chicago Cubs", "Jugador": "Goose Gossage", "Marca/Año": "Score 1989", "Número": "115", "Categoría": "HOF"},
    {"Equipo": "Chicago Cubs", "Jugador": "Mark Grace", "Marca/Año": "Donruss 1989", "Número": "115", "Categoría": "Estrella"},
    {"Equipo": "Chicago Cubs", "Jugador": "Mark Grace", "Marca/Año": "Topps 1989", "Número": "365", "Categoría": "Estrella"},
    {"Equipo": "Chicago Cubs", "Jugador": "Mark Grace", "Marca/Año": "Upper Deck 1990", "Número": "18", "Categoría": "Estrella"},
    {"Equipo": "Chicago Cubs", "Jugador": "Mark Grace", "Marca/Año": "Score 1989", "Número": "105", "Categoría": "Estrella"},
    {"Equipo": "Chicago Cubs", "Jugador": "Joe Girardi", "Marca/Año": "Upper Deck 1991", "Número": "189", "Categoría": "Base"},
    {"Equipo": "Chicago Cubs", "Jugador": "Joe Girardi", "Marca/Año": "Upper Deck 1990", "Número": "112", "Categoría": "Rookie"},
    {"Equipo": "Chicago Cubs", "Jugador": "Paul Assenmacher", "Marca/Año": "Topps 1990", "Número": "322", "Categoría": "Base"},
    {"Equipo": "Chicago Cubs", "Jugador": "Paul Assenmacher", "Marca/Año": "Upper Deck 1990", "Número": "158", "Categoría": "Base"},
    {"Equipo": "Chicago Cubs", "Jugador": "Jody Davis", "Marca/Año": "Topps 1988", "Número": "445", "Categoría": "Base"},
    {"Equipo": "Chicago Cubs", "Jugador": "Jody Davis", "Marca/Año": "Topps 1988", "Número": "445", "Categoría": "Base"},  # Duplicado
    {"Equipo": "Chicago Cubs", "Jugador": "Jody Davis", "Marca/Año": "Topps 1986", "Número": "195", "Categoría": "Base"},
    {"Equipo": "Chicago Cubs", "Jugador": "Damon Berryhill", "Marca/Año": "Topps 1991", "Número": "545", "Categoría": "Base"},
    {"Equipo": "Chicago Cubs", "Jugador": "Lance Dickson (Future Star)", "Marca/Año": "Topps 1991", "Número": "33", "Categoría": "Base"},
    {"Equipo": "Chicago Cubs", "Jugador": "Lance Dickson (Future Star)", "Marca/Año": "Topps 1991", "Número": "33", "Categoría": "Base"},  # Duplicado
    {"Equipo": "Chicago Cubs", "Jugador": "Leon Durham", "Marca/Año": "Topps 1986", "Número": "410", "Categoría": "Base"},
    {"Equipo": "Chicago Cubs", "Jugador": "Leon Durham", "Marca/Año": "Topps 1986", "Número": "410", "Categoría": "Base"},  # Duplicado
    {"Equipo": "Chicago Cubs", "Jugador": "Leon Durham", "Marca/Año": "Topps 1987", "Número": "685", "Categoría": "Base"},
    {"Equipo": "Chicago Cubs", "Jugador": "Thad Bosley", "Marca/Año": "Topps 1987", "Número": "574", "Categoría": "Base"},
    {"Equipo": "Chicago Cubs", "Jugador": "Dave Clark", "Marca/Año": "Upper Deck 1991", "Número": "337", "Categoría": "Base"},
    {"Equipo": "Chicago Cubs", "Jugador": "Earl Cunningham", "Marca/Año": "Score 1990", "Número": "10", "Categoría": "Base"},
    {"Equipo": "Chicago Cubs", "Jugador": "Brian Dayett", "Marca/Año": "Topps 1986", "Número": "637", "Categoría": "Base"},
    {"Equipo": "Chicago Cubs", "Jugador": "Doug Dascenzo", "Marca/Año": "Upper Deck 1990", "Número": "126", "Categoría": "Base"},
    {"Equipo": "Chicago Cubs", "Jugador": "Bob Dernier", "Marca/Año": "Topps 1986", "Número": "74", "Categoría": "Base"},
    {"Equipo": "Chicago Cubs", "Jugador": "Shawon Dunston", "Marca/Año": "Donruss 1989", "Número": "246", "Categoría": "Base"},
    {"Equipo": "Chicago Cubs", "Jugador": "Shawon Dunston", "Marca/Año": "Donruss 1989", "Número": "246", "Categoría": "Base"},  # Duplicado
    {"Equipo": "Chicago Cubs", "Jugador": "Frank DiPino", "Marca/Año": "Upper Deck 1990", "Número": "154", "Categoría": "Base"},
    {"Equipo": "Chicago Cubs", "Jugador": "Frank DiPino", "Marca/Año": "Topps 1988", "Número": "463", "Categoría": "Base"},
    {"Equipo": "Chicago Cubs", "Jugador": "Frank DiPino", "Marca/Año": "Topps 1990", "Número": "431", "Categoría": "Base"},
    {"Equipo": "Chicago Cubs", "Jugador": "Frank DiPino", "Marca/Año": "Donruss 1989", "Número": "533", "Categoría": "Base"},
    {"Equipo": "Chicago Cubs", "Jugador": "Mike Harkey", "Marca/Año": "Upper Deck 1990", "Número": "12", "Categoría": "Base"},
    {"Equipo": "Chicago Cubs", "Jugador": "Mike Harkey", "Marca/Año": "Score 1989", "Número": "19", "Categoría": "Base"},
    {"Equipo": "Chicago Cubs", "Jugador": "Kevin Gross", "Marca/Año": "Upper Deck 1991", "Número": "102", "Categoría": "Base"},
    {"Equipo": "Chicago Cubs", "Jugador": "Jerry Mumphrey", "Marca/Año": "Topps 1986", "Número": "212", "Categoría": "Base"},
    {"Equipo": "Chicago Cubs", "Jugador": "Keith Moreland", "Marca/Año": "Topps 1986", "Número": "440", "Categoría": "Base"},
    {"Equipo": "Chicago Cubs", "Jugador": "Jamie Moyer", "Marca/Año": "Topps 1988", "Número": "256", "Categoría": "Base"},
    {"Equipo": "Chicago Cubs", "Jugador": "Melido Pérez", "Marca/Año": "Donruss 1988", "Número": "23", "Categoría": "Inserto"},
    {"Equipo": "Chicago Cubs", "Jugador": "Dennis Martínez", "Marca/Año": "Upper Deck 1991", "Número": "45", "Categoría": "HOF"}
]

# 2. Convertir a DataFrame de Pandas
df = pd.DataFrame(datos_tarjetas)

# 3. Agrupar duplicados de manera exacta y calcular las cantidades
df_inventario = df.groupby(["Equipo", "Jugador", "Marca/Año", "Número", "Categoría"]).size().reset_index(name="Cantidad")

# 4. Ordenar el archivo de forma profesional por Equipo y luego por Jugador
df_inventario = df_inventario.sort_values(by=["Equipo", "Categoría", "Jugador"], ascending=[True, False, True])

# 5. Exportar el resultado final a una hoja de cálculo limpia
nombre_archivo = "Inventario_Maestro_Tarjetas.xlsx"
df_inventario.to_excel(nombre_archivo, index=False)

print(f"¡Inventario procesado con éxito! Se han consolidado {len(df_inventario)} entradas únicas en '{nombre_archivo}'.")