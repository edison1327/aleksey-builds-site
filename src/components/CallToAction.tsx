import { Button } from "./ui/button";

const CallToAction = () => {
  const scrollToContact = () => {
    const element = document.getElementById("contact");
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="py-24 bg-primary">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-heading font-bold text-primary-foreground mb-4 tracking-wide">
          ¿LISTO PARA COMENZAR SU PROYECTO?
        </h2>
        <p className="text-lg text-primary-foreground/90 max-w-2xl mx-auto mb-8">
          Contáctenos hoy para una consulta gratuita y descubra cómo podemos hacer realidad su visión
        </p>
        <Button
          size="lg"
          onClick={scrollToContact}
          variant="secondary"
          className="font-heading tracking-wider px-8"
        >
          CONTACTAR AHORA
        </Button>
      </div>
    </section>
  );
};

export default CallToAction;
