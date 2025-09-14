from ngrok import Ngrok

# Mets ton API Key Ngrok ici
API_KEY = "TON_API_KEY_ICI"

def lancer_tunnel():
    # Connexion à ton compte Ngrok
    ng = Ngrok(api_key=API_KEY)

    # Démarre un tunnel HTTP sur le port 7700
    tunnel = ng.http(7700)

    print("Tunnel Ngrok lancé ✅")
    print("URL publique :", tunnel.url())

if __name__ == "__main__":
    lancer_tunnel()
